"use client"

import { useEffect, useRef } from "react"

export function Hero() {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		let animationFrameId: number
		let width = window.innerWidth
		let height = window.innerHeight

		const resize = () => {
			width = window.innerWidth
			height = window.innerHeight
			canvas.width = width
			canvas.height = height
		}

		window.addEventListener("resize", resize)
		resize()

		const particles: Array<{
			x: number
			y: number
			vx: number
			vy: number
			size: number
			color: string
			life: number
		}> = []

		const createParticle = (x: number, y: number) => {
			return {
				x,
				y,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				size: Math.random() * 1.5 + 0.5,
				color: Math.random() > 0.9 ? "#ff4444" : "#ffffff", // Occasional red "error" particle
				life: Math.random() * 100 + 100,
			}
		}

		// Initialize grid points
		const gridSpacing = 40
		const cols = Math.ceil(width / gridSpacing)
		const rows = Math.ceil(height / gridSpacing)

		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				if (Math.random() > 0.85) {
					particles.push(
						createParticle(i * gridSpacing + gridSpacing / 2, j * gridSpacing + gridSpacing / 2),
					)
				}
			}
		}

		const draw = () => {
			ctx.clearRect(0, 0, width, height)

			// Draw subtle grid
			ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
			ctx.lineWidth = 1
			ctx.beginPath()
			for (let i = 0; i < cols; i++) {
				ctx.moveTo(i * gridSpacing, 0)
				ctx.lineTo(i * gridSpacing, height)
			}
			for (let j = 0; j < rows; j++) {
				ctx.moveTo(0, j * gridSpacing)
				ctx.lineTo(width, j * gridSpacing)
			}
			ctx.stroke()

			// Update and draw particles
			particles.forEach((p, index) => {
				p.x += p.vx
				p.y += p.vy
				p.life--

				if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
					// Reset particle to a random grid position
					const col = Math.floor(Math.random() * cols)
					const row = Math.floor(Math.random() * rows)
					p.x = col * gridSpacing + gridSpacing / 2
					p.y = row * gridSpacing + gridSpacing / 2
					p.life = Math.random() * 100 + 100
					p.vx = (Math.random() - 0.5) * 0.5
					p.vy = (Math.random() - 0.5) * 0.5
				}

				ctx.fillStyle = p.color === "#ff4444" ? "rgba(255, 68, 68, 0.8)" : "rgba(255, 255, 255, 0.4)"
				ctx.beginPath()
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
				ctx.fill()

				// Connect nearby particles
				for (let j = index + 1; j < particles.length; j++) {
					const p2 = particles[j]
					const dx = p.x - p2.x
					const dy = p.y - p2.y
					const dist = Math.sqrt(dx * dx + dy * dy)

					if (dist < 60) {
						ctx.strokeStyle =
							p.color === "#ff4444" || p2.color === "#ff4444"
								? "rgba(255, 68, 68, 0.15)"
								: "rgba(255, 255, 255, 0.05)"
						ctx.lineWidth = 0.5
						ctx.beginPath()
						ctx.moveTo(p.x, p.y)
						ctx.lineTo(p2.x, p2.y)
						ctx.stroke()
					}
				}
			})

			animationFrameId = requestAnimationFrame(draw)
		}

		draw()

		return () => {
			window.removeEventListener("resize", resize)
			cancelAnimationFrame(animationFrameId)
		}
	}, [])

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 h-full w-full opacity-60 pointer-events-none mix-blend-screen"
		/>
	)
}
