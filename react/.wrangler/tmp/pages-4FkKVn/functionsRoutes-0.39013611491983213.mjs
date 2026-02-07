import { onRequestGet as __api_collections__id__documents__docId__download_js_onRequestGet } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id]\\documents\\[docId]\\download.js"
import { onRequestOptions as __api_collections__id__documents__docId__download_js_onRequestOptions } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id]\\documents\\[docId]\\download.js"
import { onRequestOptions as __api_collections__id__documents_upload_js_onRequestOptions } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id]\\documents\\upload.js"
import { onRequestPost as __api_collections__id__documents_upload_js_onRequestPost } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id]\\documents\\upload.js"
import { onRequestDelete as __api_collections__id__documents__docId__js_onRequestDelete } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id]\\documents\\[docId].js"
import { onRequestOptions as __api_collections__id__documents__docId__js_onRequestOptions } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id]\\documents\\[docId].js"
import { onRequest as __api_collections__id__profiles_js_onRequest } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id]\\profiles.js"
import { onRequestPost as __api_auth_login_js_onRequestPost } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\auth\\login.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\auth\\logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\auth\\me.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\auth\\register.js"
import { onRequestOptions as __api_images_direct_upload_js_onRequestOptions } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\images\\direct-upload.js"
import { onRequestPost as __api_images_direct_upload_js_onRequestPost } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\images\\direct-upload.js"
import { onRequestGet as __api_collections__id__js_onRequestGet } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id].js"
import { onRequestOptions as __api_collections__id__js_onRequestOptions } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id].js"
import { onRequestPut as __api_collections__id__js_onRequestPut } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\[id].js"
import { onRequest as __api_profiles__slug__js_onRequest } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\profiles\\[slug].js"
import { onRequestGet as __api_collections_index_js_onRequestGet } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\index.js"
import { onRequestOptions as __api_collections_index_js_onRequestOptions } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\index.js"
import { onRequestPost as __api_collections_index_js_onRequestPost } from "C:\\Users\\Jeremiah\\source\\repos\\elementLabTech\\react\\functions\\api\\collections\\index.js"

export const routes = [
    {
      routePath: "/api/collections/:id/documents/:docId/download",
      mountPath: "/api/collections/:id/documents/:docId",
      method: "GET",
      middlewares: [],
      modules: [__api_collections__id__documents__docId__download_js_onRequestGet],
    },
  {
      routePath: "/api/collections/:id/documents/:docId/download",
      mountPath: "/api/collections/:id/documents/:docId",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_collections__id__documents__docId__download_js_onRequestOptions],
    },
  {
      routePath: "/api/collections/:id/documents/upload",
      mountPath: "/api/collections/:id/documents",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_collections__id__documents_upload_js_onRequestOptions],
    },
  {
      routePath: "/api/collections/:id/documents/upload",
      mountPath: "/api/collections/:id/documents",
      method: "POST",
      middlewares: [],
      modules: [__api_collections__id__documents_upload_js_onRequestPost],
    },
  {
      routePath: "/api/collections/:id/documents/:docId",
      mountPath: "/api/collections/:id/documents",
      method: "DELETE",
      middlewares: [],
      modules: [__api_collections__id__documents__docId__js_onRequestDelete],
    },
  {
      routePath: "/api/collections/:id/documents/:docId",
      mountPath: "/api/collections/:id/documents",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_collections__id__documents__docId__js_onRequestOptions],
    },
  {
      routePath: "/api/collections/:id/profiles",
      mountPath: "/api/collections/:id",
      method: "",
      middlewares: [],
      modules: [__api_collections__id__profiles_js_onRequest],
    },
  {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestPost],
    },
  {
      routePath: "/api/images/direct-upload",
      mountPath: "/api/images",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_images_direct_upload_js_onRequestOptions],
    },
  {
      routePath: "/api/images/direct-upload",
      mountPath: "/api/images",
      method: "POST",
      middlewares: [],
      modules: [__api_images_direct_upload_js_onRequestPost],
    },
  {
      routePath: "/api/collections/:id",
      mountPath: "/api/collections",
      method: "GET",
      middlewares: [],
      modules: [__api_collections__id__js_onRequestGet],
    },
  {
      routePath: "/api/collections/:id",
      mountPath: "/api/collections",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_collections__id__js_onRequestOptions],
    },
  {
      routePath: "/api/collections/:id",
      mountPath: "/api/collections",
      method: "PUT",
      middlewares: [],
      modules: [__api_collections__id__js_onRequestPut],
    },
  {
      routePath: "/api/profiles/:slug",
      mountPath: "/api/profiles",
      method: "",
      middlewares: [],
      modules: [__api_profiles__slug__js_onRequest],
    },
  {
      routePath: "/api/collections",
      mountPath: "/api/collections",
      method: "GET",
      middlewares: [],
      modules: [__api_collections_index_js_onRequestGet],
    },
  {
      routePath: "/api/collections",
      mountPath: "/api/collections",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_collections_index_js_onRequestOptions],
    },
  {
      routePath: "/api/collections",
      mountPath: "/api/collections",
      method: "POST",
      middlewares: [],
      modules: [__api_collections_index_js_onRequestPost],
    },
  ]