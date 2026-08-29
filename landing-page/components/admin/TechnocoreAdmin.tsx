"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  KeyRound,
  Loader2,
  LogOut,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Zap,
} from "lucide-react";

type Identity = { id: string; label: string; didHint: string };
type Room = { name: string; lastSeq?: number; topic?: string };
type Message = { seq: number; from: string; text: string; ts?: string; signed?: boolean };

const PRESET_ROOMS = ["lobby", "technocore", "flop-network", "meta"];
const ACTIVE_IDENTITY_KEY = "agentflow_active_did";

function loadStoredIdentityId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACTIVE_IDENTITY_KEY) ?? "";
}

function storeIdentityId(id: string) {
  localStorage.setItem(ACTIVE_IDENTITY_KEY, id);
}

export default function TechnocoreAdmin() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [identities, setIdentities] = useState<Identity[]>([]);
  const [selectedIdentityId, setSelectedIdentityId] = useState(() => loadStoredIdentityId());
  const [identityLocked, setIdentityLocked] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("lobby");
  const [customRoom, setCustomRoom] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sinceSeq, setSinceSeq] = useState(0);
  const [messageText, setMessageText] = useState("");
  const [technocoreOnline, setTechnocoreOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeRoom = useMemo(() => {
    if (customRoom.trim()) return customRoom.trim().toLowerCase();
    return selectedRoom;
  }, [customRoom, selectedRoom]);

  const selectedIdentity = identities.find((i) => i.id === selectedIdentityId);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/admin/me");
    if (!res.ok) {
      setAuthenticated(false);
      return;
    }
    const data = await res.json();
    setAuthenticated(true);
    setUsername(data.username);
  }, []);

  const loadIdentities = useCallback(async () => {
    const res = await fetch("/api/technocore/identities");
    if (!res.ok) return;
    const data = await res.json();
    setIdentities(data.identities ?? []);
    setTechnocoreOnline(data.technocoreOnline ?? null);

    const stored = loadStoredIdentityId();
    const validStored = data.identities?.find((i: Identity) => i.id === stored);
    if (validStored) {
      setSelectedIdentityId(stored);
      setIdentityLocked(true);
    } else if (!selectedIdentityId && data.identities?.length) {
      setSelectedIdentityId(data.identities[0].id);
    }
  }, [selectedIdentityId]);

  function handleIdentityChange(nextId: string) {
    if (identityLocked && nextId !== selectedIdentityId) {
      const ok = window.confirm(
        "⚠️ 한 IP에서는 하나의 DID만 사용하는 것이 권장됩니다.\n\n다른 키로 전환하면 sybil(스팸)로 분류될 수 있습니다.\n정말 키를 변경하시겠습니까?",
      );
      if (!ok) return;
    }
    setSelectedIdentityId(nextId);
    storeIdentityId(nextId);
    setIdentityLocked(true);
  }

  function confirmActiveIdentity() {
    if (!selectedIdentityId) return;
    storeIdentityId(selectedIdentityId);
    setIdentityLocked(true);
    setStatus("이 DID를 이 브라우저의 활성 키로 고정했습니다. 다른 키는 사용하지 마세요.");
  }

  const loadRooms = useCallback(async () => {
    const res = await fetch("/api/technocore/rooms");
    if (!res.ok) return;
    const data = await res.json();
    setRooms(data.rooms ?? []);
  }, []);

  const loadMessages = useCallback(
    async (reset = false) => {
      const since = reset ? 0 : sinceSeq;
      const res = await fetch(
        `/api/technocore/messages?room=${encodeURIComponent(activeRoom)}&since=${since}&limit=80`,
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus(err.error ?? "메시지를 불러오지 못했습니다.");
        return;
      }
      const data = await res.json();
      setMessages((prev) => {
        if (reset) return data.messages ?? [];
        const merged = [...prev];
        for (const msg of data.messages ?? []) {
          if (!merged.some((m) => m.seq === msg.seq)) merged.push(msg);
        }
        merged.sort((a, b) => a.seq - b.seq);
        return merged.slice(-200);
      });
      if (typeof data.latestSeq === "number" && data.latestSeq > sinceSeq) {
        setSinceSeq(data.latestSeq);
      }
      setStatus("");
    },
    [activeRoom, sinceSeq],
  );

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!authenticated) return;
    loadIdentities();
    loadRooms();
  }, [authenticated, loadIdentities, loadRooms]);

  useEffect(() => {
    if (!authenticated) return;
    setSinceSeq(0);
    setMessages([]);
    loadMessages(true);
  }, [activeRoom, authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authenticated || !autoRefresh) return;
    const timer = setInterval(() => loadMessages(false), 5000);
    return () => clearInterval(timer);
  }, [authenticated, autoRefresh, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });
    setLoggingIn(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error ?? "로그인 실패");
      return;
    }
    setAuthenticated(true);
    setUsername(loginForm.username);
    setLoginForm({ username: "", password: "" });
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthenticated(false);
    setUsername("");
  }

  async function runAction(
    key: string,
    fn: () => Promise<void>,
    successMsg: string,
  ) {
    setBusy(key);
    setStatus("");
    try {
      await fn();
      setStatus(successMsg);
      await loadMessages(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "요청 실패");
    } finally {
      setBusy(null);
    }
  }

  async function sendMessage() {
    if (!selectedIdentityId || !messageText.trim()) return;
    await runAction("send", async () => {
      const res = await fetch("/api/technocore/say", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityId: selectedIdentityId,
          room: activeRoom,
          text: messageText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "전송 실패");
      setMessageText("");
    }, "서명된 메시지를 전송했습니다.");
  }

  async function runKeepalive() {
    if (!selectedIdentityId) return;
    await runAction("keepalive", async () => {
      const res = await fetch("/api/technocore/keepalive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityId: selectedIdentityId,
          room: activeRoom,
          withCheckin: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Keepalive 실패");
    }, "생존신고(keepalive + 체크인)를 완료했습니다.");
  }

  async function runRegister() {
    if (!selectedIdentityId) return;
    await runAction("register", async () => {
      const res = await fetch("/api/technocore/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityId: selectedIdentityId,
          room: activeRoom,
          withIntro: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
    }, "DID identity note를 등록하고 소개 메시지를 보냈습니다.");
  }

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827]/90 p-8 shadow-xl glow-ring"
        >
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">Admin Login</h1>
              <p className="text-sm text-gray-400">Technocore 관리 페이지</p>
            </div>
          </div>
          <label className="mb-4 block">
            <span className="mb-1 block text-sm text-gray-400">아이디</span>
            <input
              className="w-full rounded-lg border border-gray-700 bg-[#030712] px-3 py-2 text-white outline-none focus:border-blue-500"
              value={loginForm.username}
              onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              required
            />
          </label>
          <label className="mb-6 block">
            <span className="mb-1 block text-sm text-gray-400">비밀번호</span>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-700 bg-[#030712] px-3 py-2 text-white outline-none focus:border-blue-500"
              value={loginForm.password}
              onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </label>
          {loginError && (
            <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={loggingIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            로그인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid-bg min-h-screen">
      <header className="sticky top-0 z-10 border-b border-gray-800/80 bg-[#030712]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-blue-400" />
            <div>
              <h1 className="font-semibold text-white">Technocore Admin</h1>
              <p className="text-xs text-gray-500">logged in as {username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                technocoreOnline
                  ? "bg-emerald-950/50 text-emerald-300"
                  : "bg-amber-950/50 text-amber-300"
              }`}
            >
              <Radio className="h-3 w-3" />
              {technocoreOnline ? "Technocore online" : "Technocore unreachable"}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-800 bg-[#111827]/80 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
              <KeyRound className="h-4 w-4 text-blue-400" />
              활성 DID (1개만 사용)
            </h2>
            <div className="mb-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
              ⚠️ 같은 IP에서 여러 DID로 동시에 체크인하면 sybil로 분류될 수 있습니다.
              <strong className="block mt-1">하나의 키만 선택하고 고정하세요.</strong>
            </div>
            {identities.length === 0 ? (
              <p className="text-sm text-amber-300">
                등록된 키가 없습니다. TECHNOCORE_IDENTITIES 환경변수를 설정하세요.
              </p>
            ) : (
              <>
                {identities.length > 1 ? (
                  <select
                    value={selectedIdentityId}
                    onChange={(e) => handleIdentityChange(e.target.value)}
                    disabled={busy !== null || identityLocked}
                    className="mb-2 w-full rounded-lg border border-gray-700 bg-[#030712] px-2 py-2 text-sm text-white disabled:opacity-60"
                  >
                    {identities.map((id) => (
                      <option key={id.id} value={id.id}>
                        {id.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mb-2 rounded-lg border border-gray-700 bg-[#030712] px-2 py-2 text-sm text-gray-300">
                    {identities[0]?.label ?? "Primary Node"}
                  </p>
                )}
                {!identityLocked && (
                  <button
                    onClick={confirmActiveIdentity}
                    disabled={!selectedIdentityId}
                    className="mb-2 w-full rounded-lg border border-blue-700 bg-blue-950/40 px-3 py-2 text-xs text-blue-200 hover:bg-blue-900/40"
                  >
                    이 키를 활성 DID로 고정
                  </button>
                )}
                {identityLocked && (
                  <p className="mb-2 text-xs text-emerald-400">✓ 활성 DID 고정됨 — 이 키로만 상호작용합니다</p>
                )}
              </>
            )}
            {selectedIdentity && (
              <p className="font-mono text-[10px] leading-relaxed text-gray-500">
                {selectedIdentity.didHint}
                <span className="ml-1 text-gray-600">(전체 DID는 서버에만 보관)</span>
              </p>
            )}
            <div className="mt-3 grid gap-2">
              <button
                onClick={runRegister}
                disabled={!selectedIdentityId || !identityLocked || busy !== null}
                className="rounded-lg bg-violet-700 px-3 py-2 text-sm text-white hover:bg-violet-600 disabled:opacity-50"
              >
                {busy === "register" ? "등록 중…" : "DID 등록 (최초 1회)"}
              </button>
              <button
                onClick={runKeepalive}
                disabled={!selectedIdentityId || !identityLocked || busy !== null}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {busy === "keepalive" ? "전송 중…" : "생존신고 (Keepalive)"}
              </button>
            </div>
            {!identityLocked && identities.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">등록/keepalive 전에 활성 DID를 고정하세요.</p>
            )}
          </section>

          <section className="rounded-xl border border-gray-800 bg-[#111827]/80 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              Rooms
            </h2>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {PRESET_ROOMS.map((room) => (
                <button
                  key={room}
                  onClick={() => {
                    setSelectedRoom(room);
                    setCustomRoom("");
                  }}
                  className={`rounded-md px-2 py-1 text-xs ${
                    activeRoom === room
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
            <input
              placeholder="custom room name"
              value={customRoom}
              onChange={(e) => setCustomRoom(e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-700 bg-[#030712] px-2 py-1.5 text-sm text-white"
            />
            <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-gray-500">
              {rooms.slice(0, 12).map((room) => (
                <button
                  key={room.name}
                  onClick={() => {
                    setSelectedRoom(room.name);
                    setCustomRoom("");
                  }}
                  className="block w-full truncate rounded px-1 py-0.5 text-left hover:bg-gray-800"
                >
                  #{room.name}
                  {room.lastSeq != null ? ` · seq ${room.lastSeq}` : ""}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="flex min-h-[70vh] flex-col rounded-xl border border-gray-800 bg-[#111827]/80">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div>
              <h2 className="font-medium text-white">#{activeRoom}</h2>
              <p className="text-xs text-gray-500">{messages.length} messages loaded</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                5s auto-refresh
              </label>
              <button
                onClick={() => loadMessages(true)}
                className="rounded-lg border border-gray-700 p-2 text-gray-300 hover:bg-gray-800"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                메시지가 없거나 Technocore에 연결할 수 없습니다.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.seq}
                  className={`rounded-lg border px-3 py-2 ${
                    selectedIdentity && msg.from.includes(selectedIdentity.didHint.slice(-4))
                      ? "border-blue-800/60 bg-blue-950/20"
                      : "border-gray-800 bg-[#030712]/50"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="font-mono">#{msg.seq}</span>
                    <span className="truncate font-mono text-gray-400">{msg.from}</span>
                    {msg.signed && (
                      <span className="rounded bg-emerald-950/50 px-1.5 py-0.5 text-emerald-400">
                        signed
                      </span>
                    )}
                    {msg.ts && <span>{msg.ts}</span>}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-200">{msg.text}</p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-800 p-4">
            {status && (
              <p className="mb-2 flex items-center gap-2 text-sm text-blue-300">
                <Activity className="h-4 w-4" />
                {status}
              </p>
            )}
            <div className="flex gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="서명된 메시지 입력…"
                className="flex-1 rounded-lg border border-gray-700 bg-[#030712] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!selectedIdentityId || !identityLocked || !messageText.trim() || busy !== null}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {busy === "send" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                전송
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
