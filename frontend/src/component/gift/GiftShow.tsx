import React, { useEffect, useState } from "react";
import NewTitle from "../../extra/Title";
import { allGiftApi, deleteGift } from "../../store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import TrashIcon from "../../assets/icons/trashIcon.svg";
import EditIcon from "../../assets/icons/EditBtn.svg";
import { useSelector } from "react-redux";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomButton from "@/extra/Button";
import { openDialog } from "@/store/dialogSlice";
import Image from "next/image";
import { warning } from "@/util/Alert";
import { Button, Menu, MenuItem } from "@mui/material";
import { baseURL } from "@/util/config";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import NoImage from "../../assets/images/noImage.png";

export default function GiftShow() {
  const dispatch = useAppDispatch();
  const { allGift } = useSelector((state: RootStore) => state.gift);

  const [search, setSearch] = useState<string | undefined>();
  const [data, setData] = useState<any>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    dispatch(allGiftApi());
  }, [dispatch]);

  useEffect(() => {
    setData(allGift);
  }, [allGift]);

  const handleDeleteGift = (item: any, gift: any) => {
    
    const data = warning();
    data
      .then((res) => {
        if (res) {
          const payload: any = {
            giftId: item?._id,
            giftCategoryId: item?._id,
          };
          dispatch(deleteGift(payload));
        }
      })
      .catch((err) => console.log(err));
  };

  const handleOpenModel = (type: any) => {
    if (type === "svga") {
      dispatch(openDialog({ type: "svgaGift" }));
    } else {
      dispatch(openDialog({ type: "imageGift" }));
    }
    setAnchorEl(null);
  };

  const handleEditGift = (item, giftData) => {
    const giftSend = {
      giftAll: item,
      giftData: giftData,
    };
    const payload: any = {
      type: giftData?.type === 3 ? "svgaGift" : "imageGift",
      data: giftSend,
    };

    dispatch(openDialog(payload));
  };
  return (
    <div className="giftCategoryShow">
      <div className="row">
        <div className="col-12 col-lg-6 col-md-6 col-sm-12 ">
          <NewTitle dayAnalyticsShow={false} titleShow={true} name={`Gifts`} />
        </div>
        <div className="col-6 new-fake-btn d-flex justify-content-end align-items-center">
          <div className="dashboardHeader primeHeader mb-3 p-0"></div>
          <Button
            id="demo-customized-button"
            aria-controls={open ? "demo-customized-menu" : undefined}
            aria-haspopup="true"
            className="newMuiButton"
            aria-expanded={open ? "true" : undefined}
            variant="contained"
            disableElevation
            onClick={handleClick}
            endIcon={<KeyboardArrowDownIcon />}
          >
            New
          </Button>
          <Menu
            id="demo-customized-menu"
            MenuListProps={{
              "aria-labelledby": "demo-customized-button",
            }}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={() => handleOpenModel("svga")} disableRipple>
              SVGA/webp
            </MenuItem>
            <MenuItem
              onClick={() => handleOpenModel("imageGift")}
              disableRipple
            >
              Image,GIF
            </MenuItem>
          </Menu>
        </div>
      </div>
      <div className="giftCategoryBox">
        <div className="row">
          {data?.length > 0 ? (
            data?.map((item: any, index: number) => {
              return (
                <div className="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3 col-xxl-3">
                  <div className="giftCategory">
                    <div className="giftCategory-img">
                      {item?.type === 3 ? (
                        <img
                          src={item?.svgaImage}
                          className="img-gift"
                          style={{
                            objectFit: "cover",
                            padding: "0px",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = NoImage.src;
                          }}
                        />
                      ) : (
                        <img
                          src={item?.image}
                          className="img-gift"
                          onError={(e) => {
                            e.currentTarget.src = NoImage.src;
                          }}
                        />
                      )}

                      <h5 style={{ margin: "20px 0px" }}>
                        {item?.coin + " " + "Coin"}
                      </h5>
                      <div className="action-button">
                        <CustomButton
                          btnIcon={<IconEdit className="text-secondary" />}
                          onClick={() => handleEditGift(item, item)}
                        />
                        <CustomButton
                          btnIcon={<IconTrash className="text-secondary" />}
                          onClick={() => handleDeleteGift(item, item)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "70vh" }}
            >
              <p className="mb-0">No Data Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
