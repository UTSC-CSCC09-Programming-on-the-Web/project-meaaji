# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations
from abc import abstractmethod
from typing import Tuple
from animated_drawings.config import ViewConfig
import os


class View:
    """
    Base View class which all other Views must be derived.
    Views are responsible for controlling what is and isn't visible to them.
    Views are responsible for initiating the 'draw' methods for each object which they want to render.
    """

    def __init__(self, cfg: ViewConfig):
        self.cfg: ViewConfig = cfg
        pass

    @abstractmethod
    def render(self, scene) -> None:  # pyright: ignore[reportUnknownParameterType,reportMissingParameterType]
        """ Called by the controller to render the scene. """

    @abstractmethod
    def clear_window(self) -> None:
        """ Clear output from previous render loop. """

    @abstractmethod
    def cleanup(self) -> None:
        """ Cleanup after render loop is finished. """

    @abstractmethod
    def get_framebuffer_size(self) -> Tuple[int, int]:
        """ Return (width, height) of framebuffer. """

    @staticmethod
    def create_view(view_cfg: ViewConfig) -> View:
        """ Takes in a view dictionary from mvc config file and returns the appropriate view. """
        # Force use of MesaView for headless rendering in Docker environment
        # Check if we're in a headless environment (no DISPLAY or using OSMesa)
        display = os.environ.get('DISPLAY')
        pyopengl_platform = os.environ.get('PYOPENGL_PLATFORM')
        use_mesa = getattr(view_cfg, 'use_mesa', False)
        
        print(f"DEBUG: DISPLAY={display}, PYOPENGL_PLATFORM={pyopengl_platform}, use_mesa={use_mesa}")
        print(f"DEBUG: This is the updated view.py file - WindowView import should be removed")
        
        # Always use MesaView in Docker environment to avoid OpenGL issues
        print(f"DEBUG: Importing MesaView...")
        from animated_drawings.view.mesa_view import MesaView
        print(f"DEBUG: Creating MesaView...")
        return MesaView(view_cfg)
