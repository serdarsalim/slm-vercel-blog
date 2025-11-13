 "use client";

import { useEffect, useRef } from "react";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

declare global {
  interface Window {
    Quill?: any;
  }
}

async function ensureQuillLoaded() {
  if (typeof window === "undefined") return;
  if (window.Quill) return;

  await new Promise<void>((resolve) => {
    const existingScript = document.getElementById("quill-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "quill-script";
    script.src = "https://cdn.quilljs.com/1.3.7/quill.js";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

function ensureStyles() {
  if (document.getElementById("quill-style")) return;
  const link = document.createElement("link");
  link.id = "quill-style";
  link.rel = "stylesheet";
  link.href = "https://cdn.quilljs.com/1.3.7/quill.snow.css";
  document.head.appendChild(link);
}

export default function QuillEditor({ value, onChange, height = 320 }: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const setupQuill = async () => {
      if (!containerRef.current) return;
      await ensureQuillLoaded();
      if (cancelled || !containerRef.current || !window.Quill) return;
      ensureStyles();

      if (!quillInstance.current) {
          quillInstance.current = new window.Quill(containerRef.current, {
            theme: "snow",
            modules: {
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "blockquote", "code-block"],
                [{ color: [] }, { background: [] }],
                ["clean"],
              ],
            },
          });

        quillInstance.current.root.innerHTML = value || "";

        quillInstance.current.on("text-change", () => {
          const html = quillInstance.current.root.innerHTML;
          onChange(html);
        });
      } else if (value !== quillInstance.current.root.innerHTML) {
        quillInstance.current.root.innerHTML = value || "";
      }
    };

    setupQuill();

    return () => {
      cancelled = true;
      if (quillInstance.current) {
        quillInstance.current.off("text-change");
        quillInstance.current = null;
      }
    };
  }, [value, onChange]);

  return <div ref={containerRef} style={{ minHeight: height, height }} />;
}
