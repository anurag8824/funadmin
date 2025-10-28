import Button from "@/extra/Button";
import Input from "@/extra/Input";
import {
  deleteReportSetting,
  getReportSetting,
  getSetting,
  settingSwitch,
  updateSetting,
} from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { useTheme } from "@emotion/react";
import { FormControlLabel, Switch, styled } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AddIcon from "@mui/icons-material/Add";
import { openDialog } from "@/store/dialogSlice";
import ReportReasonDialogue from "../reportreason/ReportReasonDialogue";
import Table from "@/extra/Table";
import Image from "next/image";
import TrashIcon from "../../assets/icons/trashIcon.svg";
import EditIcon from "../../assets/icons/EditBtn.svg";
import { warning } from "@/util/Alert";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import { IconEdit, IconTrash } from "@tabler/icons-react";


type ThemeType = "dark" | "light";
const ReportReasonSetting = () => {
  const { settingData } = useSelector((state: RootStore) => state.setting);


  const dispatch = useAppDispatch();

  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

    

  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);
  useClearSessionStorageOnPopState("multiButton");

  const theme: any = useTheme() as ThemeType;

  useEffect(() => {
    const payload: any = {};
    dispatch(getReportSetting(payload));
  }, [dispatch]);

  const handleDelete = (row) => {
    
    const data = warning();
    data
      .then((res) => {
        if (res) {
          const id = row?._id;
          dispatch(deleteReportSetting(id));
        }
      })
      .catch((err) => console.log(err));
  };

  const reportReasonTable = [
    {
      Header: "No",
      body: "name",
      Cell: ({ index }) => <span>{index + 1}</span>,
    },
    {
      Header: "Title",
      body: "name",
      Cell: ({ row }) => <span className="text-capitalize">{row?.title}</span>,
    },

    {
      Header: "Action",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <Button
            btnIcon={
              <IconEdit className="text-secondary" />
            }
            onClick={() => {
              dispatch(openDialog({ type: "editreportreason", data: row }));
            }}
          />

          <Button
            btnIcon={
              <IconTrash  className="text-secondary" />
            }
            onClick={() => handleDelete(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {dialogueType == "reportreason" && <ReportReasonDialogue />}
      {dialogueType == "editreportreason" && <ReportReasonDialogue />}

      <div className="payment-setting card1 p-0">
        <div className="cardHeader">
                  <div className=" align-items-center d-flex flex-wrap justify-content-between p-3">
                      <div>
                        <p className="m-0 fs-5 fw-medium">
                          Report Reason Setting
                        </p>
                      </div>
                      <div className="new-fake-btn">

                       <Button
                  btnIcon={<AddIcon />}
                  btnName={"New"}
                  onClick={() => {
                    dispatch(openDialog({ type: "reportreason" }));
                  }}
                />
                      </div>
                    
                  </div>
                </div>
        <div className="payment-setting-box">
          <div className="row">
            <div className="col-1fake2">
              <div className="withdrawal-box p-0 border-0 ">
                <Table
                  data={settingData}
                  mapData={reportReasonTable}
                  PerPage={size}
                  Page={page}
                  type={"client"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportReasonSetting;
