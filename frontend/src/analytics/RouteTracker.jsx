import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initializeAttribution, routeNameFromPath, track } from "./client";

// page_viewed per perpindahan route (bukan per render atau perubahan query).
const RouteTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    initializeAttribution().catch((error) => {
      console.warn("Kunjungan belum dapat dikirim ke analytics:", error.message);
    });
    track("page_viewed", { routeName: routeNameFromPath(pathname) });
  }, [pathname]);

  return null;
};

export default RouteTracker;
