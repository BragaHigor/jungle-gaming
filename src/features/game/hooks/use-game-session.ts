"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Bet, GameSession, Round } from "../contracts";
import { useGameRealtime } from "./use-game-realtime";
import {
  createSession,
  GameRequestError,
  gameError,
  getSession,
  postReset,
  postRound,
  type ClientErrorCode,
} from "../api/session";
import {
  applyRound,
  pendingStorageKey,
  readPending,
  recoverCommand,
  savePending,
  type PendingCommand,
} from "../session-state";

export const sessionQueryKey = ["game", "session"] as const;
type Phase = "idle" | "sending" | "checking" | "uncertain";
function restore() {
  try {
    return { command: readPending(window.sessionStorage), storageError: false };
  } catch {
    return { command: null, storageError: true };
  }
}

export function useGameSession(
  bet: Bet,
  reducedMotion: boolean,
  playSound: (win: boolean) => void,
) {
  const client = useQueryClient();
  const [initial] = useState(restore);
  const [pending, setPending] = useState(initial.command);
  const pendingRef = useRef(pending);
  const [phase, setPhase] = useState<Phase>(pending ? "checking" : "idle");
  const [error, setError] = useState<ClientErrorCode | null>(
    initial.storageError ? "STORAGE_UNAVAILABLE" : null,
  );
  const [animation, setAnimation] = useState<{
    round: Round;
    stopped: number;
  } | null>(null);
  // Presentation only: the query cache still receives confirmed data immediately.
  const [sessionBeforeSpin, setSessionBeforeSpin] =
    useState<GameSession | null>(null);
  const locked = useRef(false);
  const mounted = useRef(false);
  const syncQueued = useRef(false);
  const [, requestSyncRender] = useState(0);
  const query = useQuery<GameSession>({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => getSession(signal),
    retry: false,
    networkMode: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
  });
  const startMutation = useMutation({
    mutationFn: createSession,
    retry: false,
    networkMode: "always",
  });
  const roundMutation = useMutation({
    mutationFn: postRound,
    retry: false,
    networkMode: "always",
  });
  const resetMutation = useMutation({
    mutationFn: postReset,
    retry: false,
    networkMode: "always",
  });
  const session = query.data;
  const target = animation?.round;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Strict Mode may repeat this effect; it only performs abortable GETs.
  useEffect(() => {
    const command = initial.command;
    if (!command) return;
    const abort = new AbortController();
    let active = true;
    async function recover() {
      try {
        await client.cancelQueries({ queryKey: sessionQueryKey });
        const result = await recoverCommand(command!, abort.signal);
        if (!active) return;
        client.setQueryData(sessionQueryKey, result.session);
        if (result.resolved) {
          window.sessionStorage.removeItem(pendingStorageKey);
          pendingRef.current = null;
          setPending(null);
          setPhase("idle");
        } else setPhase("uncertain");
      } catch (cause) {
        if (active) {
          setError(gameError(cause).code);
          setPhase("uncertain");
        }
      }
    }
    void recover();
    return () => {
      active = false;
      abort.abort();
    };
  }, [client, initial.command]);

  useEffect(() => {
    if (!target) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!reducedMotion)
      [700, 960, 1220].forEach((delay, index) => {
        timers.push(
          setTimeout(
            () =>
              setAnimation((previous) =>
                previous?.round.id === target.id
                  ? { ...previous, stopped: index + 1 }
                  : previous,
              ),
            delay,
          ),
        );
      });
    timers.push(
      setTimeout(
        () => {
          setAnimation(null);
          setSessionBeforeSpin(null);
          playSound(target.prize > 0);
        },
        reducedMotion ? 0 : 1500,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [target, reducedMotion, playSound]);

  function clearPending() {
    try {
      window.sessionStorage.removeItem(pendingStorageKey);
    } catch {
      throw new GameRequestError("STORAGE_UNAVAILABLE", true);
    }
    pendingRef.current = null;
    setPending(null);
  }
  async function refresh() {
    const fresh = await getSession();
    if (mounted.current) client.setQueryData(sessionQueryKey, fresh);
    return fresh;
  }
  async function verify() {
    if (locked.current || animation) return;
    locked.current = true;
    syncQueued.current = false;
    setPhase("checking");
    setError(null);
    try {
      await client.cancelQueries({ queryKey: sessionQueryKey });
      const command = pendingRef.current;
      if (command) {
        const result = await recoverCommand(command);
        if (!mounted.current) return;
        client.setQueryData(sessionQueryKey, result.session);
        if (result.resolved) {
          clearPending();
          setPhase("idle");
        } else setPhase("uncertain");
      } else {
        await refresh();
        if (mounted.current) setPhase("idle");
      }
    } catch (cause) {
      if (mounted.current) {
        setError(gameError(cause).code);
        setPhase(pendingRef.current ? "uncertain" : "idle");
      }
    } finally {
      locked.current = false;
    }
  }

  async function start() {
    if (locked.current || animation) return;
    locked.current = true;
    setPhase("checking");
    setError(null);
    try {
      await client.cancelQueries({ queryKey: sessionQueryKey });
      const fresh = await startMutation.mutateAsync();
      if (!mounted.current) return;
      clearPending();
      client.setQueryData(sessionQueryKey, fresh);
      setPhase("idle");
    } catch (cause) {
      if (mounted.current) {
        setError(gameError(cause).code);
        setPhase("idle");
      }
    } finally {
      locked.current = false;
    }
  }

  async function execute(command: PendingCommand, retry = false) {
    if (locked.current || animation || (!retry && pendingRef.current)) return;
    locked.current = true;
    setError(null);
    try {
      savePending(window.sessionStorage, command);
    } catch {
      setError("STORAGE_UNAVAILABLE");
      locked.current = false;
      return;
    }
    pendingRef.current = command;
    setPending(command);
    if (command.kind === "round")
      setSessionBeforeSpin(
        client.getQueryData<GameSession>(sessionQueryKey) ?? null,
      );
    setPhase(command.kind === "round" ? "sending" : "checking");
    let animationStarted = false;
    try {
      await client.cancelQueries({ queryKey: sessionQueryKey });
      const result =
        command.kind === "round"
          ? await roundMutation.mutateAsync(command.input)
          : await resetMutation.mutateAsync(command.input);
      if (!mounted.current) return;
      if (command.kind === "round" && "symbols" in result) {
        client.setQueryData<GameSession>(sessionQueryKey, (current) =>
          applyRound(current, result),
        );
      } else if (!("symbols" in result)) {
        client.setQueryData(sessionQueryKey, result);
      }
      clearPending();
      setPhase("checking");
      let latest = client.getQueryData<GameSession>(sessionQueryKey);
      try {
        latest = await refresh();
      } catch (cause) {
        if (mounted.current) setError(gameError(cause).code);
      }
      if (mounted.current) setPhase("idle");
      if (
        mounted.current &&
        "symbols" in result &&
        latest?.generation === result.generation &&
        latest.version === result.version
      ) {
        setAnimation({ round: result, stopped: 0 });
        animationStarted = true;
      }
    } catch (cause) {
      if (!mounted.current) return;
      const failure = gameError(cause);
      setError(failure.code);
      if (!failure.uncertain) {
        setPhase("checking");
        try {
          clearPending();
          await refresh();
          if (
            mounted.current &&
            ["INSUFFICIENT_BALANCE", "SESSION_CHANGED"].includes(failure.code)
          )
            setError(null);
        } catch {
          /* Keep the last confirmed snapshot. */
        }
        setPhase("idle");
      } else {
        setPhase("uncertain");
        // One read-only recovery attempt after an uncertain POST, never another bet.
        syncQueued.current = true;
      }
    } finally {
      if (mounted.current && !animationStarted) setSessionBeforeSpin(null);
      locked.current = false;
    }
  }

  const code = initial.storageError
    ? "STORAGE_UNAVAILABLE"
    : (error ??
      (query.error
        ? gameError(query.error).code
        : (sessionBeforeSpin ?? session)?.version === 500
          ? "SESSION_LIMIT"
          : null));
  const authenticationRequired =
    code === "SESSION_REQUIRED" || code === "SESSION_EXPIRED";
  const realtime = useGameRealtime(
    !!session && !authenticationRequired,
    (version) => {
      const current = client.getQueryData<GameSession>(sessionQueryKey);
      if (version !== undefined && current && version <= current.version)
        return;
      syncQueued.current = true;
      requestSyncRender((previous) => previous + 1);
    },
  );
  // Coalesce events while a mutation/animation owns the presentation. Never let a
  // background GET race with a POST or reveal history before the reels finish.
  useEffect(() => {
    if (
      syncQueued.current &&
      !locked.current &&
      !animation &&
      phase !== "sending" &&
      phase !== "checking"
    )
      void verify();
  });
  const busy =
    phase === "sending" ||
    phase === "checking" ||
    !!animation ||
    query.isFetching;
  const canPlay =
    !!session && !busy && !pending && !authenticationRequired && !code;
  return {
    session,
    realtime,
    pending,
    phase,
    animation,
    sessionBeforeSpin,
    error: animation ? null : code,
    authenticationRequired: !animation && authenticationRequired,
    loading: query.isPending && !query.error,
    busy,
    canPlay: canPlay && session.balance >= bet,
    canReset:
      !!session && !busy && !pending && !authenticationRequired && !code,
    verify,
    start,
    spin: () =>
      session &&
      execute({
        kind: "round",
        input: {
          requestId: crypto.randomUUID(),
          generation: session.generation,
          bet,
        },
      }),
    reset: () =>
      session &&
      execute({
        kind: "reset",
        input: {
          requestId: crypto.randomUUID(),
          generation: session.generation,
          version: session.version,
        },
      }),
    retry: () => pendingRef.current && execute(pendingRef.current, true),
  };
}
export type GameSessionController = ReturnType<typeof useGameSession>;
