import { useTheme } from "@material-ui/core";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ArrowLeft from "@material-ui/icons/ArrowLeft";
import ArrowRight from "@material-ui/icons/ArrowRight";
import React, { useRef, useState } from "react";

export type NestedMenuItemProps = {
  label: string;
  parentMenuOpen: boolean;
  children: React.ReactNode;
  rightSide: boolean;
};

export default ({
  label,
  parentMenuOpen,
  children,
  rightSide
}: NestedMenuItemProps) => {
  const [subMenuOpen, setSubMenuOpen] = useState(false);

  const subMenuItem = useRef<HTMLLIElement>();

  const theme = useTheme();

  return (
    <div
      onMouseEnter={e => {
        e.stopPropagation();
        setSubMenuOpen(true);
        if (subMenuItem.current)
          subMenuItem.current.style.backgroundColor =
            theme.palette.action.hover;
      }}
      onMouseLeave={e => {
        //e.stopPropagation();
        setSubMenuOpen(false);
        if (subMenuItem.current)
          subMenuItem.current.style.backgroundColor =
            theme.palette.background.paper;
      }}
      onClick={e => {
        e.stopPropagation();
        setSubMenuOpen(subMenuOpen ? false : true);
      }}
    >
      <MenuItem
        innerRef={subMenuItem}
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        {!rightSide && <ArrowLeft />}
        {label}
        {rightSide && <ArrowRight />}
      </MenuItem>
      <Menu
        style={{ pointerEvents: "none" }}
        anchorEl={subMenuItem.current}
        anchorOrigin={{
          vertical: "top",
          horizontal: rightSide ? "right" : "left"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: rightSide ? "left" : "right"
        }}
        open={subMenuOpen && parentMenuOpen}
        onClose={() => setSubMenuOpen(false)}
      >
        <div style={{ pointerEvents: "auto" }}>{children}</div>
      </Menu>
    </div>
  );
};
