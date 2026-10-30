import { NavLink } from "react-router";

export default function Navbar() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <NavLink to="/" className="display-serif text-xl">
        Echoes
      </NavLink>
      <nav className="site-nav flex gap-6 text-sm">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Home
        </NavLink>
        <NavLink
          to="/timeline"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Timeline
        </NavLink>
        <NavLink
          to="/retrospective"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Retrospective
        </NavLink>
      </nav>
    </header>
  );
}
