import CoinPlanDialogue from "@/component/coinPlan/CoinPlanDialogue";
import CoinPlanTable from "@/component/coinPlan/CoinPlanTable";
import RootLayout from "@/component/layout/Layout";
import { RootStore, useAppSelector } from "@/store/store";
import React from "react";

const CoinPlan = () => {
  const { dialogueType } = useAppSelector((state: RootStore) => state.dialogue);
  return (
    <>
      <div className="userPage">
        <div>
          <CoinPlanTable />

          {dialogueType === "coinPlan" && <CoinPlanDialogue />}
        </div>
      </div>
    </>
  );
};
CoinPlan.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};
export default CoinPlan;
