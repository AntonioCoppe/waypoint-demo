from manim import *
import numpy as np

# 1) Smoother motion at 60fps
config.frame_rate = 60

class WaypointClamp3DScene(ThreeDScene):
    def construct(self):
        # 2) Reference axes
        axes = ThreeDAxes(
            x_range=[-1, 6, 1],
            y_range=[-3, 3, 1],
            z_range=[-3, 3, 1],
        )
        self.add(axes)

        # 3) Camera icon at origin
        cam = Sphere(radius=0.1, color=YELLOW).move_to(ORIGIN)
        cam_label = Tex("Camera").next_to(cam, UP)
        self.play(FadeIn(cam), Write(cam_label))

        # 4) Screen plane (HUD) at x=5
        screen = Square(side_length=4, fill_opacity=0.1, color=BLUE)
        screen.rotate(PI/2, axis=UP).rotate(-PI/2, axis=RIGHT).shift(RIGHT * 5)
        screen_label = Tex("Screen").next_to(screen, RIGHT, buff=0.2)
        self.play(Create(screen), Write(screen_label))

        # 5) Frustum lines from cam → screen corners
        corners = [
            np.array([5,  2,  2]),
            np.array([5,  2, -2]),
            np.array([5, -2, -2]),
            np.array([5, -2,  2]),
        ]
        frustum = VGroup(*[
            Line3D(start=ORIGIN, end=c, color=GRAY)
            for c in corners
        ])
        self.play(Create(frustum))

        # 6) Place the waypoint (we'll hide it before the sweep)
        waypoint_xyz = np.array([3, 2, 3])
        waypoint = Sphere(radius=0.1, color=RED).move_to(waypoint_xyz)
        wp_label = Tex("Waypoint").next_to(waypoint, UR)
        self.play(FadeIn(waypoint), Write(wp_label))

        # 7) Raw projection → thin laser beam
        raw_hit = self._line_plane_intersection(ORIGIN, waypoint_xyz, 5)
        raw_dot = Sphere(radius=0.05, color=ORANGE).move_to(raw_hit)
        raw_beam = Line3D(
            start=ORIGIN,
            end=raw_hit,
            thickness=0.01,    # super thin
            color=ORANGE
        )
        raw_label = Tex("Raw proj").scale(0.6).next_to(raw_dot, UR)
        self.play(Create(raw_beam), FadeIn(raw_dot), Write(raw_label))
        self.wait(1)

        # 8) Clamp to screen edge → green beam/dot
        cy = np.clip(raw_hit[1], -2, 2)
        cz = np.clip(raw_hit[2], -2, 2)
        clamp_pt = np.array([5, cy, cz])
        clamp_dot = Sphere(radius=0.05, color=GREEN).move_to(clamp_pt)
        clamp_beam = Line3D(
            start=ORIGIN,
            end=clamp_pt,
            thickness=0.01,
            color=GREEN
        )
        clamp_label = Tex("Clamped").scale(0.6).next_to(clamp_dot, UR)
        self.play(
            Transform(raw_beam, clamp_beam),
            Transform(raw_dot, clamp_dot),
            FadeTransform(raw_label, clamp_label),
        )
        self.wait(1)

        # 9) Final arrow at clamp point
        d = waypoint_xyz - clamp_pt
        final_arrow = Arrow3D(
            start=clamp_pt - normalize(d) * 0.5,
            end=clamp_pt + normalize(d) * 0.5,
            thickness=0.05,
            color=GREEN
        )
        self.play(Create(final_arrow))
        self.wait(1)

        # 10) Hide the waypoint; lock the 3D camera so the HUD stays fixed
        self.remove(waypoint, wp_label)
        self.move_camera(phi=60 * DEGREES, theta=-45 * DEGREES,
                         focal_point=waypoint_xyz, run_time=1)

        # 11) HUD arrow (always re-clamped each frame)
        def make_hud_arrow():
            raw = self._line_plane_intersection(ORIGIN, waypoint_xyz, 5)
            cy, cz = np.clip(raw[1], -2, 2), np.clip(raw[2], -2, 2)
            cp = np.array([5, cy, cz])
            d = waypoint_xyz - cp
            return Arrow3D(
                start=cp - normalize(d) * 0.5,
                end=cp + normalize(d) * 0.5,
                thickness=0.05,
                color=GREEN
            )
        hud_arrow = always_redraw(make_hud_arrow)
        self.add(hud_arrow)

        # 12) Sweep the camera icon + frustum around the waypoint
        cam_group = VGroup(cam, cam_label, frustum)
        self.play(
            Rotate(cam_group, angle=TAU, axis=UP, about_point=waypoint_xyz),
            run_time=8,
            rate_func=linear
        )
        self.wait(2)

    def _line_plane_intersection(self, p0, p1, plane_x):
        p0, p1 = np.array(p0), np.array(p1)
        t = (plane_x - p0[0]) / (p1[0] - p0[0])
        return p0 + t * (p1 - p0)

def normalize(v):
    return v / np.linalg.norm(v)
