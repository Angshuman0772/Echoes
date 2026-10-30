export default function Navbar() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <a href="/" className="display-serif text-xl">
        Echoes
      </a>
      <nav className="site-nav flex gap-6 text-sm">
        <a href="/" className="is-active">
          Home
        </a>
        <a href="/timeline">Timeline</a>
        <a href="/retrospective">Retrospective</a>
      </nav>
    </header>
  );
}
