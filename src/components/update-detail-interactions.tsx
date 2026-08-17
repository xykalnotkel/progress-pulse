"use client";

import Image from "next/image";
import { Heart, MessageCircle, Plus, Reply, Send } from "lucide-react";
import { useEffect, useState } from "react";
import HumanCheck from "@/components/human-check";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getVisitorId } from "@/lib/visitor-id";
import type { AuthorBadge, Comment, CommentReaction } from "@/lib/types";
import { REACTIONS, REACTION_LABELS } from "@/lib/constants";
import { RoleBadge } from "@/components/badges";

type Identity = { name: string; badge: AuthorBadge; avatar: string | null };

type Props = { updateId: string; initialComments: Comment[]; initialLikeCount: number; initialCommentCount: number; isDemo?: boolean };

export default function UpdateDetailInteractions({ updateId, initialComments, initialLikeCount, initialCommentCount, isDemo = false }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [likes, setLikes] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [turnstile, setTurnstile] = useState<string | null>(null);
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const [sending, setSending] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (isDemo) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (!accessToken) return;
      const response = await fetch("/api/me", { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) return;
      const me = await response.json();
      if (me.identity) setIdentity({ name: me.profile?.display_name ?? me.identity.name, badge: me.identity.badge, avatar: me.profile?.avatar_url ?? me.identity.avatar });
    })();
  }, [isDemo]);

  function resetHumanCheck() { setTurnstile(null); setTurnstileVersion((value) => value + 1); }

  async function like() {
    if (liked) return;
    if (!isDemo) {
      const response = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updateId, visitorId: getVisitorId() }) });
      if (!response.ok) return setNotice("Like belum bisa dikirim.");
    }
    setLiked(true); setLikes((value) => value + 1);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const author = identity?.name ?? name.trim();
    const message = body.trim();
    if (author.length < 2 || message.length < 2 || (!identity && !isDemo && !turnstile)) return;
    const localId = `local-${Date.now()}`;
    const local: Comment = { id: localId, update_id: updateId, parent_id: null, author_name: author, author_badge: identity?.badge ?? null, author_avatar: identity?.avatar ?? null, body: message, created_at: new Date().toISOString(), replies: [], reactions: {} };
    setComments((items) => [...items, local]);
    setBody(""); setSending(true); setNotice("Mengirim komentar...");
    try {
      if (!isDemo) {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch("/api/comments", { method: "POST", headers, body: JSON.stringify({ updateId, authorName: identity ? "" : author, body: message, visitorId: getVisitorId(), turnstileToken: turnstile ?? undefined, website: "" }) });
        if (!response.ok) throw new Error();
      }
      setNotice("Komentar berhasil dikirim."); resetHumanCheck();
    } catch {
      setComments((items) => items.filter((item) => item.id !== localId));
      setBody(message); setNotice("Komentar gagal dikirim. Coba lagi."); resetHumanCheck();
    } finally { setSending(false); }
  }

  function addReply(parentId: string, reply: Comment) {
    setComments((items) => items.map((item) => item.id === parentId ? { ...item, replies: [...(item.replies ?? []), reply] } : item));
  }

  const totalComments = initialCommentCount + Math.max(0, comments.length - initialComments.length);
  return <section className="detail-interactions">
    {notice && !composerOpen ? <p className="detail-action-state">{notice}</p> : null}
    <div className="detail-action-row">
      <button type="button" className={liked ? "detail-like detail-like-active" : "detail-like"} onClick={like}><Heart size={17} fill={liked ? "currentColor" : "none"}/><strong>{likes}</strong><span>Like</span></button>
      <button type="button" className="detail-comment-jump" onClick={() => { setComposerOpen(true); setNotice(""); }}><MessageCircle size={17}/><strong>{totalComments}</strong><span>Komentar</span></button>
    </div>
    <div className="detail-comment-section">
      <div className="comments-heading"><h3>Diskusi <span>{totalComments}</span></h3><p>Tulis komentar langsung di halaman ini.</p></div>
      <div className="detail-thread-list">{comments.map((comment) => <Thread key={comment.id} comment={comment} updateId={updateId} token={token} identity={identity} isDemo={isDemo} onReply={addReply}/>)}</div>
      {!comments.length ? <div className="detail-empty-bubble"><MessageCircle size={18}/><p>Belum ada komentar. Jadi yang pertama membuka diskusi.</p></div> : null}
      {composerOpen ? <div className="comment-sheet-overlay" role="dialog" aria-modal="true" aria-label="Tulis komentar" onMouseDown={(event) => { if (event.target === event.currentTarget && !sending) setComposerOpen(false); }}>
        <form id="tulis-komentar" className="comment-sheet" onSubmit={submit}>
          <div className="comment-sheet-handle"/><div className="comment-sheet-head"><div><small>KOMENTAR</small><h4>Tulis komentar</h4></div><button type="button" onClick={() => setComposerOpen(false)} disabled={sending}>Tutup</button></div>
          {identity ? <div className="comment-form-as">{identity.avatar ? <Image src={identity.avatar} alt="" width={30} height={30} className="comment-form-avatar"/> : null}<div className="comment-form-name"><strong>{identity.name}</strong><RoleBadge badge={identity.badge}/></div></div> : <input value={name} onChange={(event) => setName(event.target.value)} maxLength={48} placeholder="Nama kamu" required autoFocus/>}
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} placeholder="Tambahkan komentar..." required autoFocus={Boolean(identity)}/>
          {!identity && !isDemo ? <HumanCheck key={turnstileVersion} action="comment" onToken={setTurnstile}/> : null}
          {notice ? <p className={`comment-sheet-state ${notice.includes("gagal") ? "error" : notice.includes("berhasil") ? "success" : "loading"}`}>{notice}</p> : null}
          <button type="submit" className="detail-submit" disabled={sending || (!identity && !isDemo && !turnstile)}><Send size={15}/>{sending ? "Mengirim..." : "Kirim komentar"}</button>
        </form>
      </div> : null}
    </div>
  </section>;
}

function Thread({ comment, updateId, token, identity, isDemo, onReply }: { comment: Comment; updateId: string; token: string | null; identity: Identity | null; isDemo: boolean; onReply: (parentId: string, reply: Comment) => void }) {
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [body, setBody] = useState(""); const [human, setHuman] = useState<string | null>(null); const [version, setVersion] = useState(0); const [reactions, setReactions] = useState(comment.reactions ?? {});
  async function react(reaction: CommentReaction) { if (!isDemo) { const response = await fetch("/api/comment-reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId: comment.id, reaction, visitorId: getVisitorId() }) }); if (!response.ok) return; } setReactions((value) => ({ ...value, [reaction]: (value[reaction] ?? 0) + 1 })); }
  async function reply(event: React.FormEvent) { event.preventDefault(); const author = identity?.name ?? name.trim(); if (author.length < 2 || body.trim().length < 2 || (!identity && !isDemo && !human)) return; const headers: Record<string,string> = { "Content-Type":"application/json" }; if (token) headers.Authorization = `Bearer ${token}`; if (!isDemo) { const response = await fetch("/api/comments", { method:"POST", headers, body:JSON.stringify({ updateId, parentId:comment.id, authorName:identity ? "" : author, body, visitorId:getVisitorId(), turnstileToken:human ?? undefined, website:"" }) }); if (!response.ok) return; } onReply(comment.id, { id:`reply-${Date.now()}`, update_id:updateId, parent_id:comment.id, author_name:author, author_badge:identity?.badge ?? null, author_avatar:identity?.avatar ?? null, body:body.trim(), created_at:new Date().toISOString(), replies:[], reactions:{} }); setBody("");setOpen(false);setHuman(null);setVersion((v)=>v+1); }
  return <article className="thread-bubble"><div className="thread-avatar">{comment.author_avatar ? <Image src={comment.author_avatar} alt="" width={34} height={34}/> : comment.author_name.slice(0,1)}</div><div className="thread-content"><div className="thread-head"><strong>{comment.author_name}</strong><RoleBadge badge={comment.author_badge}/><time>{new Date(comment.created_at).toLocaleDateString("id-ID")}</time></div><p>{comment.body}</p><div className="thread-actions">{REACTIONS.map((reaction)=><button type="button" key={reaction} onClick={()=>react(reaction)}>{REACTION_LABELS[reaction]}{(reactions[reaction] ?? 0) > 0 ? <b>{reactions[reaction]}</b> : null}</button>)}<button type="button" onClick={()=>setOpen(!open)}><Reply size={12}/>Balas</button></div>{open ? <form className="thread-reply-form" onSubmit={reply}>{!identity ? <input value={name} onChange={(event)=>setName(event.target.value)} placeholder="Nama kamu" required/> : null}<textarea value={body} onChange={(event)=>setBody(event.target.value)} placeholder={`Balas @${comment.author_name}`} required/>{!identity && !isDemo ? <HumanCheck key={version} action="comment_reply" onToken={setHuman}/> : null}<button type="submit"><Send size={13}/>Kirim</button></form> : null}<div className="reply-chain">{(comment.replies ?? []).map((reply)=><div className="reply-node" key={reply.id}><span className="reply-plus"><Plus size={12}/></span><div className="reply-bubble"><strong>{reply.author_name}</strong><RoleBadge badge={reply.author_badge}/><p>{reply.body}</p></div></div>)}</div></div></article>;
}
