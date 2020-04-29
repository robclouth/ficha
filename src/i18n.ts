import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./lang/en";
import es from "./lang/es";

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en,
      es
    },
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: [
        "querystring",
        "cookie",
        "localStorage",
        "navigator",
        "htmlTag",
        "path",
        "subdomain"
      ]
    }
  });

export default i18n;
