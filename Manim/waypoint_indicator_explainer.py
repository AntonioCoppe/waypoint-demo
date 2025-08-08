from manim import *
import numpy as np


class WaypointIndicatorExplainer(ThreeDScene):
    def construct(self):
        # Scene parameters
        screen_x = 5.0
        half_size = 2.0  # screen extends in y,z ∈ [-2, 2]

        # Axes
        axes = ThreeDAxes(
            x_range=[-4, 8, 1],
            y_range=[-4, 4, 1],
            z_range=[-4, 4, 1],
        )
        self.add(axes)

        # Camera representation at origin, looking along +X
        cam = Sphere(radius=0.12, color=YELLOW).move_to(ORIGIN)
        # Helper for readable labels with background
        def badge(text: str, scale: float = 0.6, fg=WHITE) -> VGroup:
            t = Text(text, color=fg).scale(scale)
            bg = RoundedRectangle(corner_radius=0.06, height=t.height + 0.14, width=t.width + 0.24,
                                  fill_opacity=0.7, fill_color=BLACK, stroke_width=0)
            t.move_to(bg.get_center())
            return VGroup(bg, t)
        cam_label = always_redraw(lambda: badge("Camera", 0.6).next_to(cam, DOWN, buff=0.12))
        fwd_dir = Arrow3D(
            start=ORIGIN,
            end=np.array([1.8, 0.0, 0.0]),
            color=YELLOW,
            thickness=0.04,
        )
        fwd_tip = np.array([1.8, 0.0, 0.0])
        fwd_label = always_redraw(lambda: badge("Forward", 0.5).move_to(fwd_tip + np.array([0.0, 0.25, 0.0])))
        self.play(FadeIn(cam), FadeIn(cam_label), Create(fwd_dir), FadeIn(fwd_label), run_time=0.6)

        # Screen plane at x = screen_x
        screen = Square(side_length=2 * half_size, color=BLUE, fill_opacity=0.06)
        screen.rotate(PI / 2, axis=UP)   # align with YZ plane
        screen.rotate(-PI / 2, axis=RIGHT)
        screen.shift(RIGHT * screen_x)
        screen_overlay = badge(f"Screen x={screen_x:.1f}", 0.5)
        screen_overlay.to_corner(UR)
        self.add_fixed_in_frame_mobjects(screen_overlay)
        self.play(Create(screen), FadeIn(screen_overlay), run_time=0.6)

        # Frustum edges from origin to screen corners (near visualization)
        corners = [
            np.array([screen_x,  half_size,  half_size]),
            np.array([screen_x,  half_size, -half_size]),
            np.array([screen_x, -half_size, -half_size]),
            np.array([screen_x, -half_size,  half_size]),
        ]
        frustum_lines = VGroup(*[Line3D(start=ORIGIN, end=c, color=GRAY) for c in corners])
        self.play(Create(frustum_lines), run_time=0.6)

        # Waypoint (animated)
        t = ValueTracker(0.0)

        def waypoint_path(tt: float) -> np.ndarray:
            # A looping path that swings around the camera, goes behind, above/below, and off to the sides
            # x governs distance in front/behind; y/z oscillate to show edge behavior
            x = 3 + 4 * np.cos(tt * 0.5)
            y = 2.2 * np.sin(tt * 0.9)
            z = 2.8 * np.sin(tt * 0.6 + 0.7)
            return np.array([x, y, z])

        # Utility math
        def line_plane_intersection(p0: np.ndarray, p1: np.ndarray, plane_x: float) -> np.ndarray:
            # Parametric line p(t) = p0 + t*(p1 - p0); solve for x = plane_x
            v = p1 - p0
            if abs(v[0]) < 1e-6:
                # Parallel to plane; fall back to plane center
                return np.array([plane_x, 0.0, 0.0])
            t_param = (plane_x - p0[0]) / v[0]
            return p0 + t_param * v

        def component_clamp_yz(y: float, z: float, r: float) -> tuple[float, float]:
            return float(np.clip(y, -r, r)), float(np.clip(z, -r, r))

        def center_ray_edge_clamp(point_on_plane: np.ndarray, plane_center: np.ndarray, r: float) -> np.ndarray:
            # Project along center-to-point direction until hitting the square boundary |y|=r or |z|=r
            d = point_on_plane - plane_center
            # Handle degenerate case
            if abs(d[1]) < 1e-9 and abs(d[2]) < 1e-9:
                return plane_center.copy()
            # Scale so that max(|y|, |z|) == r (solve hitting either horizontal or vertical boundary first)
            ty = (r / abs(d[1])) if abs(d[1]) > 1e-9 else np.inf
            tz = (r / abs(d[2])) if abs(d[2]) > 1e-9 else np.inf
            s = min(ty, tz)
            return plane_center + d * s

        def normalized(v: np.ndarray) -> np.ndarray:
            n = np.linalg.norm(v)
            if n < 1e-9:
                return np.zeros_like(v)
            return v / n

        # Dynamic waypoint + its label
        waypoint = always_redraw(lambda: Sphere(radius=0.12, color=RED).move_to(waypoint_path(t.get_value())))
        wp_label = always_redraw(lambda: badge("Waypoint", 0.5).next_to(waypoint, UR, buff=0.08))

        # Raw projection to the plane x = screen_x
        plane_center = np.array([screen_x, 0.0, 0.0])
        raw_dot = always_redraw(lambda: Sphere(radius=0.09, color=ORANGE).move_to(
            line_plane_intersection(ORIGIN, waypoint.get_center(), screen_x)
        ))
        raw_line = always_redraw(lambda: Line3D(ORIGIN, raw_dot.get_center(), color=ORANGE))
        raw_label = always_redraw(lambda: badge("Raw proj", 0.45).next_to(raw_dot, UR, buff=0.08))

        # Component-wise clamp: y,z ∈ [-half_size, half_size]
        clamp_comp_dot = always_redraw(lambda: Sphere(radius=0.09, color=GREEN).move_to(
            np.array([
                screen_x,
                component_clamp_yz(raw_dot.get_center()[1], raw_dot.get_center()[2], half_size)[0],
                component_clamp_yz(raw_dot.get_center()[1], raw_dot.get_center()[2], half_size)[1],
            ])
        ))
        clamp_comp_line = always_redraw(lambda: Line3D(ORIGIN, clamp_comp_dot.get_center(), color=GREEN))
        clamp_comp_label = always_redraw(lambda: badge("Rect clamp", 0.45).next_to(clamp_comp_dot, UL, buff=0.08))

        # Center-ray edge clamp: intersect the ray from plane center to raw hit with the square boundary
        clamp_edge_dot = always_redraw(lambda: Sphere(radius=0.09, color=TEAL).move_to(
            center_ray_edge_clamp(raw_dot.get_center(), plane_center, half_size)
        ))
        clamp_edge_line = always_redraw(lambda: Line3D(ORIGIN, clamp_edge_dot.get_center(), color=TEAL))
        clamp_edge_label = always_redraw(lambda: badge("Ray-edge clamp", 0.45).next_to(clamp_edge_dot, DL, buff=0.08))

        # Arrow at clamped point, oriented toward true waypoint direction (3D)
        def make_arrow_at(point: np.ndarray, target: np.ndarray, color=GREEN) -> Arrow3D:
            direction = normalized(target - point)
            if np.linalg.norm(direction) < 1e-6:
                direction = np.array([1.0, 0.0, 0.0])
            return Arrow3D(
                start=point - direction * 0.45,
                end=point + direction * 0.45,
                color=color,
                thickness=0.05,
            )

        arrow_comp = always_redraw(lambda: make_arrow_at(clamp_comp_dot.get_center(), waypoint.get_center(), color=GREEN))
        arrow_edge = always_redraw(lambda: make_arrow_at(clamp_edge_dot.get_center(), waypoint.get_center(), color=TEAL))

        # Behind-camera indicator note
        def behind_text() -> Mobject:
            p = waypoint.get_center()
            return (badge("Behind camera", 0.5, fg=RED).next_to(cam, LEFT, buff=0.2) if p[0] < 0 else VGroup())

        behind_label = always_redraw(behind_text)

        # Keep 3D-anchored labels upright (billboard toward camera)
        self.add_fixed_orientation_mobjects(
            cam_label,
            fwd_label,
            wp_label,
            raw_label,
            clamp_comp_label,
            clamp_edge_label,
            behind_label,
        )

        # Add dynamic objects
        self.play(FadeIn(waypoint), FadeIn(wp_label), run_time=0.6)
        self.play(Create(raw_line), FadeIn(raw_dot), FadeIn(raw_label), run_time=0.6)
        self.play(Create(clamp_comp_line), FadeIn(clamp_comp_dot), FadeIn(clamp_comp_label), run_time=0.6)
        self.play(Create(clamp_edge_line), FadeIn(clamp_edge_dot), FadeIn(clamp_edge_label), run_time=0.6)
        self.play(Create(arrow_comp), Create(arrow_edge), FadeIn(behind_label), run_time=0.6)

        # Side panel: math summary
        math_lines = VGroup(
            MathTex(r"p_{raw} = p_0 + t (p_w - p_0),\\\ t = \frac{x_s - p_{0,x}}{(p_w - p_0)_x}").scale(0.6),
            MathTex(r"p_{comp} = (x_s,\ \mathrm{clip}(y, -h, h),\ \mathrm{clip}(z, -h, h))").scale(0.6),
            MathTex(r"p_{edge} = c + s \,(p_{raw} - c),\ s = \min\{\tfrac{h}{|\Delta y|},\tfrac{h}{|\Delta z|}\}").scale(0.6),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.25).to_corner(UL)
        box = SurroundingRectangle(math_lines, color=WHITE, buff=0.2)
        self.add_fixed_in_frame_mobjects(box, math_lines)
        self.play(FadeIn(box), FadeIn(math_lines), run_time=0.6)

        # Animate the waypoint along its path; camera orbit for context
        # Game-like multi-angle camera instead of constant orbit
        # Segment 1 (~8s motion)
        self.move_camera(phi=55 * DEGREES, theta=-35 * DEGREES, run_time=1.0)
        self.play(t.animate.set_value(2 * PI), run_time=7.0, rate_func=linear)
        # Segment 2 (~4s motion)
        self.move_camera(phi=25 * DEGREES, theta=-15 * DEGREES, run_time=1.0)
        self.play(t.animate.set_value(3 * PI), run_time=3.0, rate_func=linear)
        # Pull back to show full frame, then hold
        self.move_camera(phi=60 * DEGREES, theta=-40 * DEGREES, run_time=0.6)
        self.wait(2.0)

        # Final focus: orbit the camera and highlight clamped arrows
        # End
        self.play(FadeOut(behind_label), run_time=0.3)


def normalized(v):
    v = np.array(v)
    n = np.linalg.norm(v)
    if n < 1e-9:
        return v
    return v / n


