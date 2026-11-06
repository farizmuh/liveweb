import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/useAuthStore";
import AdminView from "../views/AdminView.vue";
import OverlayView from "../views/OverlayView.vue";
import BottomOverlayView from "../views/BottomOverlayView.vue";
import LoginView from "../views/LoginView.vue";
import MatchesView from "../views/MatchesView.vue";
import TeamsView from "../views/TeamsView.vue";
import BracketAdminView from "../views/BracketAdminView.vue";
import BracketOverlayView from "../views/BracketOverlayView.vue";

const routes = [
  {
    path: "/",
    redirect: "/admin",
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminView,
    meta: { requiresAuth: true },
  },
  {
    path: "/overlay",
    name: "overlay",
    component: OverlayView,
    meta: { layout: "clean" },
  },
  {
    path: "/overlay/:key",
    name: "overlay-keyed",
    component: OverlayView,
    meta: { layout: "clean" },
  },
  {
    path: "/overlay/bottom",
    name: "overlay-bottom",
    component: BottomOverlayView,
    meta: { layout: "clean" },
  },
  {
    path: "/overlay/bottom/:key",
    name: "overlay-bottom-keyed",
    component: BottomOverlayView,
    meta: { layout: "clean" },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/matches",
    name: "matches",
    component: MatchesView,
    meta: { requiresAuth: true },
  },
  {
    path: "/teams",
    name: "teams",
    component: TeamsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/bracket",
    name: "bracket-admin",
    component: BracketAdminView,
    meta: { requiresAuth: true },
  },
  {
    path: "/overlay/bracket",
    name: "overlay-bracket",
    component: BracketOverlayView,
    meta: { layout: "clean" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next({ name: "login" });
  } else {
    next();
  }
});

export default router;

