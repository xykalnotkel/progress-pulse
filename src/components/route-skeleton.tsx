export default function RouteSkeleton({ detail = false }: { detail?: boolean }) {
  return <main className="route-skeleton"><div className="skeleton-nav"><span/><i/><i/></div><div className={detail ? "skeleton-detail" : "skeleton-layout"}><section><b/><h1/><p/><p/></section>{detail ? <div className="skeleton-comment-stack"><i/><i/><i/></div> : <div className="skeleton-grid"><i/><i/><i/></div>}</div></main>;
}
