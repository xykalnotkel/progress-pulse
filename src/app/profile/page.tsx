import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Code2 } from "lucide-react";
import { getPublicOwnerProfile } from "@/lib/public-profile";

export const revalidate = 300;
export const metadata: Metadata = { title: "Profil Kall", description: "Profil publik owner XySpace: bio, status, aktivitas, dan tautan.", alternates: { canonical: "/profile" } };

export default async function ProfilePage() {
  const profile = await getPublicOwnerProfile();
  const name = profile.display_name ?? "Kall";
  return <main className="public-profile-page">
    <Link href="/" className="profile-back"><ArrowLeft size={15}/> Kembali ke Home</Link>
    <article className="public-profile-card">
      <div className="public-profile-banner">{profile.banner_url ? <Image src={profile.banner_url} alt={`Banner ${name}`} fill sizes="(max-width:720px) 100vw, 720px" priority/> : <div className="profile-banner-art"/>}</div>
      <div className="public-profile-body">
        <div className="public-profile-avatar">{profile.avatar_url ? <Image src={profile.avatar_url} alt={name} width={96} height={96} priority/> : name.slice(0,1).toUpperCase()}</div>
        <div className="profile-name-row"><div><h1>{name}</h1><p>{profile.title ?? "Founder & builder"}</p></div><span className={`presence presence-${profile.status_kind ?? "offline"}`}><i/>{profile.status_text || profile.status_kind || "offline"}</span></div>
        {profile.activity_text ? <div className="profile-activity"><Code2 size={16}/><div><small>SEDANG DIKERJAKAN</small><strong>{profile.activity_text}</strong></div></div> : null}
        {profile.bio ? <p className="public-profile-bio">{profile.bio}</p> : null}
        <div className="public-profile-links">{profile.links.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={14}/></a>)}</div>
      </div>
    </article>
  </main>;
}
