import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
];

export function NavSidebar() {
  return (
    <aside className="bg-black/95 text-white w-56 border-r border-white/10 px-4 py-6">
      <nav aria-label="Main">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded px-3 py-2 transition-colors hover:bg-white/10"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default NavSidebar;
