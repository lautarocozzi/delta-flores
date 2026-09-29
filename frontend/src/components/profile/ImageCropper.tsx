import { useRef, useState, useCallback, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCropperProps {
    imageSrc: string;
    onCrop: (file: File) => void;
    onCancel: () => void;
    size?: number; // output size in px (square)
}

export function ImageCropper({ imageSrc, onCrop, onCancel, size = 400 }: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });

    // Pinch state
    const lastTouchDist = useRef<number | null>(null);
    const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

    const CROP_SIZE = 250; // visible crop circle diameter

    // Draw the canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

        // Draw background (dark overlay)
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        // Clear the circle area
        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

        // Calculate image dimensions to fill the circle
        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawW: number, drawH: number;
        if (imgAspect > 1) {
            drawH = CROP_SIZE * zoom;
            drawW = drawH * imgAspect;
        } else {
            drawW = CROP_SIZE * zoom;
            drawH = drawW / imgAspect;
        }

        const x = (CROP_SIZE - drawW) / 2 + offset.x;
        const y = (CROP_SIZE - drawH) / 2 + offset.y;

        ctx.drawImage(img, x, y, drawW, drawH);
        ctx.restore();

        // Draw circle border
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [zoom, offset]);

    // Load image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imgRef.current = img;
            // Fit image to fill circle
            const imgAspect = img.naturalWidth / img.naturalHeight;
            const minZoom = imgAspect > 1
                ? CROP_SIZE / (CROP_SIZE * imgAspect)
                : CROP_SIZE / (CROP_SIZE / imgAspect);
            setZoom(Math.max(minZoom, 1));
            setOffset({ x: 0, y: 0 });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Redraw on state change
    useEffect(() => {
        draw();
    }, [draw]);

    // Mouse drag
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setOffsetStart({ ...offset });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setOffset({ x: offsetStart.x + dx, y: offsetStart.y + dy });
    };

    const handleMouseUp = () => setIsDragging(false);

    // Touch handlers (drag + pinch)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            setOffsetStart({ ...offset });
        } else if (e.touches.length === 2) {
            setIsDragging(false);
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
            lastTouchCenter.current = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
            const dx = e.touches[0].clientX - dragStart.x;
            const dy = e.touches[0].clientY - dragStart.y;
            setOffset({ x: offsetStart.x + dx, y: offsetStart.y + dy });
        } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const scale = dist / lastTouchDist.current;
            setZoom((prev) => Math.min(Math.max(prev * scale, 0.5), 4));
            lastTouchDist.current = dist;
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        lastTouchDist.current = null;
        lastTouchCenter.current = null;
    };

    // Generate cropped file
    const handleCrop = () => {
        const img = imgRef.current;
        if (!img) return;

        const outCanvas = document.createElement("canvas");
        outCanvas.width = size;
        outCanvas.height = size;
        const ctx = outCanvas.getContext("2d");
        if (!ctx) return;

        // Clip to circle
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawW: number, drawH: number;
        if (imgAspect > 1) {
            drawH = size * zoom;
            drawW = drawH * imgAspect;
        } else {
            drawW = size * zoom;
            drawH = drawW / imgAspect;
        }

        const x = (size - drawW) / 2 + offset.x * (size / CROP_SIZE);
        const y = (size - drawH) / 2 + offset.y * (size / CROP_SIZE);

        ctx.drawImage(img, x, y, drawW, drawH);

        outCanvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], "profile-image.png", { type: "image/png" });
            onCrop(file);
        }, "image/png");
    };

    const handleReset = () => {
        setOffset({ x: 0, y: 0 });
        if (imgRef.current) {
            const img = imgRef.current;
            const imgAspect = img.naturalWidth / img.naturalHeight;
            const minZoom = imgAspect > 1
                ? CROP_SIZE / (CROP_SIZE * imgAspect)
                : CROP_SIZE / (CROP_SIZE / imgAspect);
            setZoom(Math.max(minZoom, 1));
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Canvas preview */}
            <div
                ref={containerRef}
                className="relative touch-none select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <canvas
                    ref={canvasRef}
                    width={CROP_SIZE}
                    height={CROP_SIZE}
                    className="rounded-full cursor-grab active:cursor-grabbing"
                    style={{ width: CROP_SIZE, height: CROP_SIZE }}
                />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 w-full max-w-[250px]">
                <span className="text-xs text-muted-foreground">−</span>
                <Slider
                    value={[zoom]}
                    onValueChange={(v) => setZoom(v[0])}
                    min={0.5}
                    max={4}
                    step={0.05}
                    className="flex-1"
                />
                <span className="text-xs text-muted-foreground">+</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                </Button>
                <Button variant="outline" size="sm" onClick={onCancel}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                </Button>
                <Button size="sm" onClick={handleCrop}>
                    <Check className="w-4 h-4 mr-1" />
                    Aplicar
                </Button>
            </div>
        </div>
    );
}
