import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  createBrowserRouter,
  RouteObject,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from "./error-page";
import Route, { navlist } from "./route";
import "./main.css";
import { loader as rootLoader } from "./route";

const extraRouter = navlist;

const mainRouter: RouteObject = {
  path: "*",
  element: <Route></Route>,
  loader: rootLoader,
  errorElement: <ErrorPage />,
  children: navlist.filter((item) => {
    return item.type === "page";
  }),
};

const router = createBrowserRouter([mainRouter]);

function main() {
  const root = createRoot(document.getElementById("app")!);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

main();
