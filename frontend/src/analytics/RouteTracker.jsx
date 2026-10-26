import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { routeNameFromPath, track } from "./client";

// page_viewed per perpindahan route (bukan per render atau perubahan query).
const RouteTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    track("page_viewed", { routeName: routeNameFromPath(pathname) });
  }, [pathname]);

  return null;
};

export default RouteTracker;
