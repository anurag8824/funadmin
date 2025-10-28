import RootLayout from "@/component/layout/Layout";
import { RootStore, useAppSelector } from "@/store/store";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import NewTitle from "../extra/Title";
import PendingRequest from "@/component/withdrawRequest/PendingRequest";
import AcceptedRequest from "@/component/withdrawRequest/AcceptedRequest";
import DeclineRequest from "@/component/withdrawRequest/DeclineRequest";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";

const withdrawRequest = () => {
  const dispatch = useDispatch(); // Added dispatch variable with type inference

  const { dialogue, dialogueType, dialogueData } = useAppSelector(
    (state: RootStore) => state.dialogue
  );

  const [dayAnalytics, setDayAnalytics] = useState<string>("today");
  const [multiButtonSelect, setMultiButtonSelect] = useState<string>("User");
  const [startDate, setStartDate] = useState<string | Date>("All"); // Updated type
  const [endDate, setEndDate] = useState<string | Date>("All"); // Updated type
  useClearSessionStorageOnPopState("multiButton");

  const startDateFormat = (startDate: string | Date): string => {
    return startDate && dayjs(startDate).isValid()
      ? dayjs(startDate).format("YYYY-MM-DD")
      : "All";
  };

  const endDateFormat = (endDate: string | Date): string => {
    return endDate && dayjs(endDate).isValid()
      ? dayjs(endDate).format("YYYY-MM-DD")
      : "All";
  };

  const startDateData: string = startDateFormat(startDate);
  const endDateData: string = endDateFormat(endDate);

  return (
    <>
      <div className="userPage">
        <div
          style={{
            display: `${
              dialogueType === "hostSettleMent"
                ? "none"
                : dialogueType === "hostHistory"
                ? "none"
                : dialogueType === "fakeUserAdd"
                ? "none"
                : dialogueType === "fakeUser"
                ? "none"
                : dialogueType === "hostReport"
                ? "none"
                : "block"
            }`,
          }}
        >
          <div className="dashboardHeader primeHeader mb-3 p-0">
            <NewTitle
              dayAnalyticsShow={true}
              setEndDate={setEndDate}
              setStartDate={setStartDate}
              startDate={startDate}
              endDate={endDate}
              titleShow={false}
              setMultiButtonSelect={setMultiButtonSelect}
              multiButtonSelect={multiButtonSelect}
              name={`Withdrawal Request`}
              labelData={["Pending", "Accepted", "Declined"]}
            />
          </div>
          {multiButtonSelect == "Pending" && (
            <PendingRequest
              endDate={endDateData}
              startDate={startDateData}
              multiButtonSelectNavigate={setMultiButtonSelect}
            />
          )}
          {multiButtonSelect == "Accepted" && (
            <AcceptedRequest endDate={endDateData} startDate={startDateData} />
          )}
          {multiButtonSelect == "Declined" && (
            <DeclineRequest endDate={endDateData} startDate={startDateData} />
          )}
        
        </div>
      </div>
    </>
  );
};
withdrawRequest.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};
export default withdrawRequest;
