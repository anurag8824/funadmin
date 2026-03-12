import * as React from "react";
import Switch from "@mui/material/Switch";

export default function ToggleSwitch(props: any) {
  return (
    <>
      <label className="switch me-2" style={props.style}>
        <Switch
          checked={props.value}
          onChange={props.onChange}
          inputProps={{ "aria-label": "controlled" }}
          onClick={props.onClick}
          style={{
            cursor: "pointer",
            color:
              "linear-gradient(45deg, rgba(139, 130, 252, 1), rgba(125, 130, 251, 1), rgba(210, 111, 244, 1))",
          }}
          disabled={props.disabled}
        />
      </label>
    </>
  );
}
