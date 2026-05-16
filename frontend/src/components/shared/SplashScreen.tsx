import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface SplashScreenProps {
    onComplete: () => void;
    duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
    const [isVisible, setIsVisible] = useState(true);
    const isMobile = useIsMobile();

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleAnimationComplete = () => {
        if (!isVisible) {
            onComplete();
        }
    };

    return (
        <AnimatePresence onExitComplete={handleAnimationComplete}>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] overflow-hidden"
                >
                    {/* MOBILE SPLASH - splash.png as FULL BACKGROUND, NO text */}
                    {isMobile ? (
                        <div className="relative w-full h-full">
                            {/* splash.png as full cover background */}
                            <motion.img
                                src="/splash.png"
                                alt="Flores del Delta"
                                initial={{ scale: 1.05, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6 }}
                                className="w-full h-full object-cover"
                            />

                            {/* Loading dots at bottom */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-12 left-0 right-0 flex justify-center gap-2"
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                        }}
                                        className="w-2.5 h-2.5 rounded-full bg-primary"
                                    />
                                ))}
                            </motion.div>
                        </div>
                    ) : (
                        /* DESKTOP SPLASH - LOGO_LANDING_3 full + "Flores del Delta" text */
                        <div className="relative w-full h-full">
                            {/* Full screen background image - LOGO_LANDING_3 */}
                            <img
                                src="/LOGO_LANDING_3.png"
                                alt="Flores del Delta"
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay for text visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

                            {/* Text overlay - "Flores del Delta" */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="absolute bottom-20 left-0 right-0 flex flex-col items-center text-center"
                            >
                                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                                    Flores <span className="text-primary">del Delta</span>
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Cultiva mejor, produce mejor.
                                </p>
                            </motion.div>

                            {/* Loading indicator bottom */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="absolute bottom-6 left-0 right-0 flex justify-center gap-2"
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            y: [0, -8, 0],
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                        }}
                                        className="w-3 h-3 rounded-full bg-primary"
                                    />
                                ))}
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
