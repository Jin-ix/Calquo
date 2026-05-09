import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { MoveDirection, OutMode } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

interface ParticleNetworkBgProps {
    color?: string;
    linksColor?: string;
}

export const ParticleNetworkBg = ({ color = "#0d9488", linksColor = "#14b8a6" }: ParticleNetworkBgProps) => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: any): Promise<void> => {
        console.log("Particles container loaded", container);
    };

    if (!init) {
        return null;
    }

    return (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-90" style={{ pointerEvents: 'auto' }}>
            <Particles
                id="tsparticles"
                particlesLoaded={particlesLoaded}
                className="w-full h-full"
                options={{
                    background: {
                        color: {
                            value: "transparent",
                        },
                    },
                    fpsLimit: 120,
                    interactivity: {
                        events: {
                            onClick: {
                                enable: true,
                                mode: "push",
                            },
                            onHover: {
                                enable: true,
                                mode: "grab",
                            },
                        },
                        modes: {
                            push: {
                                quantity: 4,
                            },
                            grab: {
                                distance: 150,
                                links: {
                                    opacity: 0.6,
                                    color: linksColor
                                }
                            },
                        },
                    },
                    particles: {
                        color: {
                            value: color, // Customizable color
                        },
                        links: {
                            color: linksColor, // Customizable link color
                            distance: 140,
                            enable: true,
                            opacity: 0.25,
                            width: 1,
                        },
                        move: {
                            direction: MoveDirection.none,
                            enable: true,
                            outModes: {
                                default: OutMode.out,
                            },
                            random: false,
                            speed: 0.8,
                            straight: false,
                        },
                        number: {
                            density: {
                                enable: true,
                                width: 800,
                                height: 800
                            },
                            value: 80, // slightly more particles
                        },
                        opacity: {
                            value: 0.8, // increased opacity of particles
                        },
                        shape: {
                            type: "circle",
                        },
                        size: {
                            value: { min: 1, max: 2.5 },
                        },
                    },
                    detectRetina: true,
                }}
            />
        </div>
    );
};
