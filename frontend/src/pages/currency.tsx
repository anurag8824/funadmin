import CurrencyDialogue from "@/component/currency/CurrencyDialogue";
import CurrencyTable from "@/component/currency/CurrencyTable";
import RootLayout from "@/component/layout/Layout";
import { RootStore, useAppSelector } from "@/store/store";
import React from "react";

const Currency = () => {
  const { dialogue, dialogueType, dialogueData } = useAppSelector(
    (state: RootStore) => state.dialogue
  );

  return (
    <>
      <div className="userPage">
       
          <CurrencyTable />

          {dialogueType === "currency" && <CurrencyDialogue />}
        
      </div>
    </>
  );
};
Currency.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};
export default Currency;
