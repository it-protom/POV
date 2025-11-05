"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Smartphone, Monitor, Tablet, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils";
import FormPreview from "@/pages/user/forms/[id]/FormPreview";

interface Form {
  id: string;
  title: string;
  description?: string;
  type: "SURVEY" | "QUIZ";
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string;
  questions: any[];
  theme?: any;
}

export default function PreviewFormPage() {
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showControls, setShowControls] = useState(true);
  const [buttonPosition, setButtonPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  // Carica i dati del form
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await authenticatedFetch(`/api/forms/${params.id}/public?preview=true`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch form");
        }
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [params.id]);

  // Gestione del drag del bottone
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const moved = Math.abs(e.clientX - startPosition.x) > 3 || Math.abs(e.clientY - startPosition.y) > 3;
        if (moved) {
          setHasMoved(true);
        }
        
        setButtonPosition({
          x: Math.max(0, Math.min(newX, window.innerWidth - 40)),
          y: Math.max(0, Math.min(newY, window.innerHeight - 40)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => setHasMoved(false), 0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, startPosition]);

  useEffect(() => {
    const handleResize = () => {
      setButtonPosition(prev => ({
        ...prev,
        y: Math.min(prev.y, window.innerHeight - 80),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsDragging(true);
    setHasMoved(false);
    setStartPosition({ x: e.clientX, y: e.clientY });
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-red-600">Form non trovato</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Controlli Preview - Overlay fisso */}
      {showControls && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Preview Controls</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowControls(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("desktop")}
                className="h-8 text-xs"
              >
                <Monitor className="h-3 w-3 mr-1" />
                Desktop
              </Button>
              <Button
                variant={previewMode === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("tablet")}
                className="h-8 text-xs"
              >
                <Tablet className="h-3 w-3 mr-1" />
                Tablet
              </Button>
              <Button
                variant={previewMode === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("mobile")}
                className="h-8 text-xs"
              >
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile
              </Button>
            </div>
            <Link to={`/admin/forms/${params.id}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs w-full">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Torna al Form
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottone per mostrare controlli se nascosti - draggable */}
      {!showControls && (
        <Button
          variant="default"
          size="icon"
          className="fixed z-50 h-10 w-10 rounded-full shadow-lg cursor-move"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
          }}
          onMouseDown={handleMouseDown}
          onClick={() => {
            setTimeout(() => {
              if (!hasMoved && !isDragging) {
                setShowControls(true);
              }
            }, 0);
          }}
        >
          <Eye className="h-5 w-5" />
        </Button>
      )}

      {/* Container con dimensioni responsive */}
      <div className={`mx-auto transition-all duration-300 ${
        previewMode === "desktop" ? "w-full" :
        previewMode === "tablet" ? "w-full max-w-4xl" :
        "w-full max-w-md"
      }`}>
        <FormPreview form={form} />
      </div>
    </div>
  );
}
