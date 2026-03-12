import { Tooltip } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { IconUser } from '@tabler/icons-react';

export default function Navigator(props: any) {
  const pathname = usePathname();

  const { name, path, path2  , path3, navIcon, onClick, navIconImg, navSVG, liClass , } = props;

  const handleOnChange = (e: any) => {
    // console.log("handleOnChange", e.target.value);
  };
  return (
    <ul className="mainMenu">
      <li
        onClick={onClick}
        className={liClass}
        onChange={handleOnChange}
        value={name}
      >
        <Tooltip title={name} placement="right">
          <Link
            href={path ? path?.toString() : ""}
            className={`${pathname === path ? "activeMenu" : pathname === path2 ?  "activeMenu" : pathname === path3 ?"activeMenu" : ""}`}

          >
            <div>
              {/* {navIconImg ? (
                <>
                  <img src={navIconImg} />
                </>
              ) : navIcon ? (
                <>
                  <i className={navIcon}></i>
                </>
              ) : (
                <>{navSVG}</>
              )} */}
              {navIcon}
              {/* <IconUser/> */}
              <span className="text-capitalize">{name}</span>
            </div>
            {props?.children && <KeyboardArrowRightIcon />}
          </Link>
        </Tooltip>
        {/* If Submenu */}
        <ul className={`subMenu transform0`}>
          {props.children?.map((res: any) => {
            const { subName, subPath, onClick } = res?.props;
            return (
              <>
                <Tooltip title={subName} placement="right">
                  <li>
                    <Link
                      href={subPath}
                      className={`${pathname === subPath && "activeMenu"}`}
                      onClick={onClick}
                    >
                      <FiberManualRecordIcon style={{ fontSize: "10px" }} />
                      <span style={{ fontSize: "14px" }}>{subName}</span>
                    </Link>
                  </li>
                </Tooltip>
              </>
            );
          })}
        </ul>
      </li>
    </ul>
  );
}
