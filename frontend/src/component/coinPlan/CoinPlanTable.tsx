import Button from "@/extra/Button";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import ToggleSwitch from "@/extra/ToggleSwitch";
import {
  activeCoinPlan,
  deleteCoinPlan,
  getAllCoinPlan,
} from "@/store/coinPlanSlice";
import { openDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch, useAppSelector } from "@/store/store";
import dayjs from "dayjs";
import NewTitle from "../../extra/Title";
import Image from "next/image";
import EditIcon from "../../assets/icons/EditBtn.svg";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CustomButton from "@/extra/Button";
import AddIcon from "@mui/icons-material/Add";
import { baseURL } from "@/util/config";
import { IconEdit } from "@tabler/icons-react";

import NoImage from '../../assets/images/hashtagbanner.png'


const CoinPlanTable = () => {
  const { dialogue, dialogueType, dialogueData } = useAppSelector(
    (state: RootStore) => state.dialogue
  );

  

  const { coinPlan } = useSelector((state: RootStore) => state.coinPlan);


  const dispatch = useAppDispatch();
  const [data, setData] = useState<any>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  useEffect(() => {
    dispatch(getAllCoinPlan());
  }, [dispatch]);

  useEffect(() => {
    setData(coinPlan);
  }, [coinPlan]);


  const coinPlanTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }) => <span>{index + 1}</span>,
    },

    {
      Header: "Icon",
      body: "icon",
      Cell: ({ row }) => (
        <img
          src={ row?.icon}
          width="50px"
          height="50px"
          onError={(e) => {
            e.currentTarget.src = NoImage.src;
          }}
        />
      ),
    },
    {
      Header: "Coin",
      body: "coin",
      Cell: ({ row }) => <span className="text-capitalize">{row?.coin}</span>,
    },

    {
      Header: "Amount",
      body: "amount",
      Cell: ({ row }) => <span className="text-capitalize">{row?.amount}</span>,
    },
    {
      Header: "Product key",
      body: "productKey",
      Cell: ({ row }) => (
        <span className="">{row?.productKey ? row?.productKey : "-"}</span>
      ),
    },

    {
      Header: "Is Active",
      body: "isActive",
      Cell: ({ row }) => (
        <ToggleSwitch
          value={row?.isActive}
          onChange={() => handleIsActive(row)}
        />
      ),
    },
    {
      Header: "Created date",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("DD MMMM YYYY") : ""}
        </span>
      ),
    },
    {
      Header: "Action",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <CustomButton
            btnIcon={
             <IconEdit className="text-secondary" />
            }
            onClick={() => handleEditCoinPlan(row)}
          />

        </div>
      ),
    },
  ];

  const handleOpenNew = (type: any) => {
    dispatch(openDialog({ type: "coinPlan" }));

    let dialogueData_ = {
      dialogue: true,
      type: type,
    };
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
  };

  const handleEditCoinPlan = (data: any) => {
    dispatch(openDialog({ type: "coinPlan", data: data }));
  };

  const handleIsActive = (row: any) => {

    
    
    let payload: any = {
      coinPlanId: row?._id,
    };
    dispatch(activeCoinPlan(payload));
  };
  return (
    <div className=" withdrawal-page">
      
      <div className=" user-table">
        <div className="user-table-top">
          <div className="w-100">
            <h5
              style={{
                 fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
              }}
            >
              Coin-plan
            </h5>
          </div>
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn d-flex justify-content-end">
            <Button
              btnIcon={<AddIcon />}
              btnName={"New"}
              onClick={() => handleOpenNew("coinPlan")}
            />
          </div>
        </div>
        <div className="">
          <Table
            data={data}
            mapData={coinPlanTable}
            PerPage={size}
            Page={page}
            type={"client"}
          />
          <div className="">
            <Pagination
              type={"client"}
              activePage={page}
              rowsPerPage={size}
              userTotal={coinPlan?.length}
              setPage={setPage}
              setData={setData}
              data={data}
              actionShow={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinPlanTable;
