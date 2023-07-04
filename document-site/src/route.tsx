import { Outlet, Link, useLoaderData, NavLink } from "react-router-dom";
import Playground from "./getting-start/playground";
import Introuction from "./getting-start/introduction.mdx";
import Integration from "./getting-start/integration.mdx";
import Install from "./getting-start/install.mdx";
import CoreConcept from "./getting-start/core-concept.mdx";

interface props {}

type NavItem = {
  type: "page" | "divide" | "headings";
  path?: string;
  level?: number;
  title?: string;
  element?: JSX.Element;
};

type LoaderData = {
  navlist: NavItem[];
};

export const navlist: NavItem[] = [
  { type: "headings", title: "Getting Started" },
  {
    type: "page",
    title: "Playground",
    path: "playground",
    element: <Playground />,
  },
  {
    type: "page",
    title: "Introduction",
    path: "introduct",
    element: <Introuction />,
  },
  {
    type: "page",
    title: "Core Concept",
    path: "core-concept",
    element: <CoreConcept />,
  },
  // {
  //   type: "page",
  //   title: "Shortcuts",
  //   path: "shortcuts",
  //   element: <Intro></Intro>,
  // },
  {
    type: "page",
    title: "Install",
    path: "install",
    element: <Install></Install>,
  },
  {
    type: "page",
    title: "Integration",
    path: "integration",
    element: <Integration></Integration>,
  },

  // {
  //   type: "page",
  //   title: "OHNO World",
  //   path: "ohno-world",
  //   element: <Intro></Intro>,
  // },
  { type: "headings", title: "Blocks" },
  // {
  //   type: "page",
  //   title: "Paragraph",
  //   path: "paragraph-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Headings",
  //   path: "headings-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Blockquote",
  //   path: "blockquote-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "List",
  //   path: "list-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Table",
  //   path: "table-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Code",
  //   path: "code-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Equation",
  //   path: "equation-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Divide",
  //   path: "divide-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Figure",
  //   path: "figure-block",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Custom Block Component",
  //   path: "custom-block",
  //   element: <Intro></Intro>,
  // },
  // { type: "headings", title: "Formats" },
  // { type: "headings", title: "Inlines" },
  // {
  //   type: "page",
  //   title: "Backlink",
  //   path: "backlink-inline",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "KeyLabel",
  //   path: "keylabel-inline",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Inline Equation",
  //   path: "math-inline",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Flag",
  //   path: "flag-inline",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Todo Item",
  //   path: "todo-item-inline",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Custom Inline Component",
  //   path: "custom-inline",
  //   element: <Intro></Intro>,
  // },
  { type: "headings", title: "Plugins" },
  // {
  //   type: "page",
  //   title: "Context Menu",
  //   path: "contextmenu-plugin",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Dragable",
  //   path: "dragable-plugin",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Inline Supporter",
  //   path: "inlinesupport-plugin",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Link Supporter",
  //   path: "link-plugin",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Paste Supporter",
  //   path: "pasteall-plugin",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Slash Menu",
  //   path: "slashmenu-plugin",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Toolbar",
  //   path: "toolbar-plugin",
  //   element: <Intro></Intro>,
  // },
  // {
  //   type: "page",
  //   title: "Custom Plugin Component",
  //   path: "custom-plugin",
  //   element: <Intro></Intro>,
  // },
];

export async function loader(): Promise<LoaderData> {
  return { navlist };
}

export default function Route() {
  const { navlist } = useLoaderData() as LoaderData;

  return (
    <>
      <div id="sidebar">
        {false && (
          <div>
            <form id="search-form" role="search">
              <input
                id="q"
                aria-label="Search contacts"
                placeholder="Search"
                type="search"
                name="q"
              />
              <div id="search-spinner" aria-hidden hidden={true} />
              <div className="sr-only" aria-live="polite"></div>
            </form>
            <form method="post">
              <button type="submit">New</button>
            </form>
          </div>
        )}
        <nav>
          <ul>
            {navlist.map((item, index) => {
              if (item.type === "divide") {
                return <li key={index}>{item.title}</li>;
              } else if (item.type === "headings") {
                return (
                  <li key={index}>
                    {!item.level && <h1>{item.title}</h1>}
                    {item.level === 1 && <h1>{item.title}</h1>}
                    {item.level === 2 && <h2>{item.title}</h2>}
                    {item.level === 3 && <h3>{item.title}</h3>}
                    {item.level === 4 && <h4>{item.title}</h4>}
                    {item.level === 5 && <h5>{item.title}</h5>}
                  </li>
                );
              } else if (item.type === "page") {
                return (
                  <li key={index}>
                    <NavLink
                      to={item.path!}
                      className={({ isActive, isPending }) =>
                        isPending ? "pending" : isActive ? "active" : ""
                      }
                    >
                      {item.title}
                    </NavLink>
                  </li>
                );
              }
            })}
          </ul>
        </nav>
      </div>
      <div id="detail">
        <Outlet />
      </div>
    </>
  );
}
