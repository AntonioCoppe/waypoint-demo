from manim import *
import numpy as np

class WaypointClamp3DScene(ThreeDScene):
    def construct(self):
        # Axes for reference
        axes = ThreeDAxes(
            x_range=[-1, 6, 1],
            y_range=[-3, 3, 1],
            z_range=[-3, 3, 1],
        )
        self.add(axes)

        # 1) Camera at origin
        cam = Sphere(radius=0.1, color=YELLOW).move_to(ORIGIN)
        cam_label = Tex("Camera").next_to(cam, UP)
        self.play(FadeIn(cam), Write(cam_label))

        # 2) Screen plane at x=5
        screen = Square(side_length=4, fill_opacity=0.1, color=BLUE)
        screen.rotate(PI/2, axis=UP)
        screen.rotate(-PI/2, axis=RIGHT)
        screen.shift(RIGHT * 5)
        screen_label = Tex("Screen").next_to(screen, RIGHT, buff=0.2)
        self.play(Create(screen), Write(screen_label))

        # 3) Frustum edges
        corners = [
            np.array([5, 2, 2]),
            np.array([5, 2, -2]),
            np.array([5, -2, -2]),
            np.array([5, -2, 2]),
        ]
        frustum_lines = VGroup(*[
            Line3D(start=ORIGIN, end=corner, color=GRAY)
            for corner in corners
        ])
        self.play(Create(frustum_lines))

        # 4) Waypoint out in space
        waypoint_xyz = np.array([3, 2, 3])
        waypoint = Sphere(radius=0.1, color=RED).move_to(waypoint_xyz)
        wp_label = Tex("Waypoint").next_to(waypoint, UR)
        self.play(FadeIn(waypoint), Write(wp_label))

        # 5) Raw projection to plane x=5 (now a solid line)
        raw_hit = self._line_plane_intersection(ORIGIN, waypoint_xyz, plane_x=5)
        raw_dot = Sphere(radius=0.1, color=ORANGE).move_to(raw_hit)
        raw_line = Line3D(ORIGIN, raw_hit, color=ORANGE)  # <- dashed removed
        raw_label = Tex("Raw proj").scale(0.6).next_to(raw_dot, UR)
        self.play(Create(raw_line), FadeIn(raw_dot), Write(raw_label))
        self.wait(1)

        # 6) Clamp into y,z ∈ [-2,2]
        clamped_y = np.clip(raw_hit[1], -2, 2)
        clamped_z = np.clip(raw_hit[2], -2, 2)
        clamp_point = np.array([5, clamped_y, clamped_z])
        clamp_dot = Sphere(radius=0.1, color=GREEN).move_to(clamp_point)
        clamp_line = Line3D(ORIGIN, clamp_point, color=GREEN)
        clamp_label = Tex("Clamped").scale(0.6).next_to(clamp_dot, UR)
        self.play(
            Transform(raw_line, clamp_line),
            Transform(raw_dot, clamp_dot),
            Transform(raw_label, clamp_label)
        )
        self.wait(1)

        # 7) Arrow at clamp point, oriented toward the true waypoint direction
        direction = waypoint_xyz - clamp_point
        arrow = Arrow3D(
            start=clamp_point - normalize(direction)*0.5,
            end=clamp_point + normalize(direction)*0.5,
            color=GREEN, thickness=0.05
        )
        self.play(Create(arrow))
        self.wait(2)


        # 8) Rotate camera for a final 3D view
        self.move_camera(phi=60 * DEGREES, theta=-45 * DEGREES, run_time=3)
        self.wait()

    def _line_plane_intersection(self, p0, p1, plane_x=5):
        p0 = np.array(p0)
        p1 = np.array(p1)
        t = (plane_x - p0[0]) / (p1[0] - p0[0])
        return p0 + t * (p1 - p0)

def normalize(v):
    v = np.array(v)
    return v / np.linalg.norm(v)
