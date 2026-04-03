import { useState, useEffect, useRef, useCallback } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import "@google/model-viewer";

// 💬 Bubble
function ChatBubble({ notif, side }) {
    return (
        <div
            style={{
                position: "absolute",
                [side === "left" ? "right" : "left"]: "calc(100% + 12px)",
                top: "10px",
                width: "220px",
                background: "rgba(20,20,40,0.75)",
                backdropFilter: "blur(14px)",
                borderRadius: "16px",
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.2)",
                animation: "bubbleIn 0.3s ease",
                zIndex: 10000,
                pointerEvents: "none"
            }}
        >
            <b style={{ fontSize: 12 }}>🔔 Thông báo</b>
            <p style={{ margin: 0, fontSize: 13 }}>{notif.msg}</p>
        </div>
    );
}

export default function VibeTokPet() {
    const PET_SIZE = 140;

    const [pos, setPos] = useState({
        x: window.innerWidth - 180,
        y: window.innerHeight - 220
    });

    const [dragging, setDragging] = useState(false);
    const [notif, setNotif] = useState(null);
    const [isTalking, setIsTalking] = useState(false);
    const [bob, setBob] = useState(0);

    const dragOffset = useRef({ x: 0, y: 0 });
    const shownRef = useRef(new Set());
    const timeoutRef = useRef([]);

    const { notifications, markRead } = useNotifications();

    // 🔥 Notification logic
    useEffect(() => {
        if (!notifications?.length) return;

        const latest = notifications[0];

        if (!latest.read && !shownRef.current.has(latest.id)) {
            shownRef.current.add(latest.id);

            const messages = {
                like: `${latest.actor?.fullName || "Ai đó"} vừa thích video ❤️`,
                comment: `${latest.actor?.fullName || "Ai đó"} đã comment 💬`,
                follow: `${latest.actor?.fullName || "Ai đó"} đã follow bạn 👀`
            };

            const showTimeout = setTimeout(() => {
                if (document.hidden) return;

                setNotif({
                    type: latest.type,
                    msg: messages[latest.type] || "Bạn có thông báo mới!"
                });

                setIsTalking(true);
            }, 400);

            const hideTimeout = setTimeout(() => {
                setNotif(null);
                setIsTalking(false);
            }, 4500);

            timeoutRef.current.push(showTimeout, hideTimeout);

            markRead(latest.id);
        }

        return () => {
            timeoutRef.current.forEach(clearTimeout);
            timeoutRef.current = [];
        };
    }, [notifications, markRead]);

    // 🌊 Floating animation
    useEffect(() => {
        let t = 0;
        let frame;

        const animate = () => {
            t += 0.05;
            setBob(Math.sin(t) * 5);
            frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    // 🧠 Auto move
    useEffect(() => {
        const move = setInterval(() => {
            if (dragging) return;

            setPos(prev => {
                const nx = prev.x + (Math.random() * 120 - 60);
                const ny = prev.y + (Math.random() * 120 - 60);

                return {
                    x: Math.max(0, Math.min(window.innerWidth - PET_SIZE, nx)),
                    y: Math.max(0, Math.min(window.innerHeight - PET_SIZE, ny))
                };
            });
        }, 5000);

        return () => clearInterval(move);
    }, [dragging]);

    // 🖱 Drag start
    const onMouseDown = useCallback((e) => {
        dragOffset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
        setDragging(true);
    }, [pos]);

    // 🖱 Drag move + snap
    useEffect(() => {
        if (!dragging) return;

        const onMove = (e) => {
            setPos({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        };

        const onUp = () => {
            setDragging(false);

            // snap vào cạnh
            setPos(prev => ({
                ...prev,
                x:
                    prev.x < window.innerWidth / 2
                        ? 10
                        : window.innerWidth - PET_SIZE - 10
            }));
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [dragging]);

    return (
        <>
            <style>{`
        @keyframes bubbleIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

            <div
                onMouseDown={onMouseDown}
                style={{
                    position: "fixed",
                    left: pos.x,
                    top: pos.y,
                    width: PET_SIZE,
                    height: PET_SIZE,
                    zIndex: 9999,
                    cursor: dragging ? "grabbing" : "grab",
                    transform: `
            scale(${isTalking ? 1.15 : 1})
            translateY(${dragging ? 0 : bob}px)
            rotate(${Math.sin(bob) * 2}deg)
            rotateY(${pos.x < window.innerWidth / 2 ? 0 : 180}deg)
          `,
                    transition: "transform 0.2s"
                }}
            >
                {notif && (
                    <ChatBubble
                        notif={notif}
                        side={pos.x > window.innerWidth / 2 ? "left" : "right"}
                    />
                )}

                {/* 🦁 3D PET */}
                <model-viewer
                    src="/Lion.glb"
                    autoplay
                    camera-controls={false}
                    disable-zoom
                    disable-pan
                    camera-orbit="0deg 75deg 2.5m"
                    field-of-view="45deg"
                    style={{
                        width: "100%",
                        height: "100%",
                        background: "transparent",
                        pointerEvents: "none"
                    }}
                />

                {/* Shadow */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 5,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "80px",
                        height: "10px",
                        background:
                            "radial-gradient(ellipse, rgba(0,0,0,0.25), transparent)"
                    }}
                />
            </div>
        </>
    );
}

