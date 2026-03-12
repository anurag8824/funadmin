import BannerDialogue from "@/component/banner/BannerDialogue";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import Pagination from "@/extra/Pagination";
import TrashIcon from "../assets/icons/trashIcon.svg";
import EditIcon from "../assets/icons/EditBtn.svg";
import Table from "@/extra/Table";
import Title from "@/extra/Title";
import ToggleSwitch from "@/extra/ToggleSwitch";
import { activeBanner, deleteBanner, getBanner } from "@/store/bannerSlice";
import { openDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { warning } from "@/util/Alert";
import { baseURL } from "@/util/config";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AddIcon from "@mui/icons-material/Add";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import NoImage from '../assets/images/noImage.png'

interface BannerData {
  _id: string;
  image: string;
  isActive: false;
}

const Banner = () => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const { banner } = useSelector((state: RootStore) => state.banner);

  const dispatch = useAppDispatch();

  const [data, setData] = useState<any[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = useState<any>(1);
  const [size, setSize] = useState(20);
  

  useEffect(() => {
    dispatch(getBanner());
  }, [dispatch]);

  useEffect(() => {
    setData(banner);
  }, [banner]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleDeleteBanner = (row: any) => {
    
    const data = warning();
    data
      .then((res) => {
        if (res) {
          dispatch(deleteBanner(row?._id));
        }
      })
      .catch((err) => console.log(err));
  };

  const bannerTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span>{page * parseInt(index) + 1}</span>
      ),
    },
    {
      Header: "Banner Image",
      Cell: ({ row, index }: { row: BannerData; index: number }) => (
        <div className="userProfile">
          <img
            src={row?.image}
            style={{ height: "75px", width: "150px", borderRadius: "8px" }}
            alt={`Banner`}
            onError={(e) => {
              e.currentTarget.src = NoImage.src;
            }}
          />
        </div>
      ),
    },

    {
      Header: "Active Status",
      body: "isActive",
      sorting: { type: "client" },
      Cell: ({ row }: { row: BannerData }) => (
        <ToggleSwitch
          value={row?.isActive}
          onClick={() => {
            
            const id: any = row?._id;
            dispatch(activeBanner(id));
          }}
        />
      ),
    },

    {
      Header: "Action",
      Cell: ({ row }: { row: BannerData }) => (
        <>
          <div className="action-button">
            <Button
              btnIcon={
                <IconEdit className="text-secondary" />
              }
              onClick={() => {
                dispatch(openDialog({ type: "editbanner", data: row }));
              }}
            />

            <Button
              btnIcon={
                <IconTrash  className="text-secondary" />
              }
              onClick={() => handleDeleteBanner(row)}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      {dialogueType === "banner" && <BannerDialogue />}
      {dialogueType === "editbanner" && <BannerDialogue />}

      {/* <div className={`userTable`} style={{ padding: "20px" }}>
        <Title name="Banner" />

        <div className="betBox">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn">
            <Button
              btnIcon={<AddIcon />}
              btnName={"New"}
              onClick={() => {
                dispatch(openDialog({ type: "banner" }));
              }}
            />
          </div>
        </div>
        <div className="mt-3">
          <Table
            data={data}
            mapData={bannerTable}
            PerPage={size}
            Page={page}
            type={"client"}
          />
          <div className="mt-3">
            <Pagination
              type={"client"}
              activePage={page}
              rowsPerPage={size}
              userTotal={data?.length}
              setPage={setPage}
              setData={setData}
              data={data}
              actionShow={false}
            />
          </div>
        </div>
      </div> */}

      <div className="userPage">
        <div className="user-table real-user mb-3">
          <div className="user-table-top">
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "18px",
                  marginBottom: "5px",
                  marginTop: "5px",
                  markerStart: "10px",
                }}
              >
                Banner
              </h5>
              <div className="betBox">
                <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn">
                  <Button
                    btnIcon={<AddIcon />}
                    btnName={"New"}
                    onClick={() => {
                      dispatch(openDialog({ type: "banner" }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <Table
            data={data}
            mapData={bannerTable}
            PerPage={size}
            Page={page}
            type={"client"}
          />
          <Pagination
            type={"client"}
            activePage={page}
            rowsPerPage={size}
            userTotal={data?.length}
            setPage={setPage}
            setData={setData}
            data={data}
            actionShow={false}
          />
        </div>
      </div>
    </>
  );
};
Banner.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default Banner;
