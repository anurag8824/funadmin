import Button from "@/extra/Button";
import Input from "@/extra/Input";
import { addCurrency, updateCurrency } from "@/store/currencySlice";
import { closeDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";

import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
const style: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "5px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
  // padding: "19px",
};

interface ErrorState {
  name: String;
  symbol: String;
  countryCode: String;
  currencyCode: String;
}

const CurrencyDialogue = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );


  const dispatch = useAppDispatch();
  const [addCurrencyOpen, setAddCurrencyOpen] = useState(false);

  const [name, setName] = useState<string>();
  const [mongoId, setMongoId] = useState<string>("");

  const [symbol, setSymbol] = useState<string>();
  const [currencyCode, setCurrencyCode] = useState<string>();
  const [countryCode, setCountryCode] = useState<string>();

  const [error, setError] = useState<ErrorState>({
    name: "",
    symbol: "",
    countryCode: "",
    currencyCode: "",
  });
  

  useEffect(() => {
    if (dialogue) {
      setAddCurrencyOpen(dialogue);
    }
  }, [dialogue]);

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData._id);
      setName(dialogueData.name);
      setSymbol(dialogueData.symbol);
      setCountryCode(dialogueData.countryCode);
      setCurrencyCode(dialogueData.currencyCode);
    }
  }, [dialogueData]);

  const handleSubmit = () => {
      
    if (!name || !symbol || !currencyCode || !countryCode) {
      let error = {} as ErrorState;
      if (!name) error.name = "Name Is Required !";

      if (!symbol) error.symbol = "Symbol Is Required !";
      if (!currencyCode) error.currencyCode = "CurrencyCode is required !";
      if (!countryCode) error.countryCode = "CountryCode is required !";

      return setError({ ...error });
    } else {
      const addContactUs: any = {
        name: name,
        symbol: symbol,
        currencyCode: currencyCode,
        countryCode: countryCode,
      };
      if (dialogueData) {
        let data: any = {
          data: addContactUs,
          currencyId: mongoId,
        };
        dispatch(updateCurrency(data));
      } else {
        dispatch(addCurrency(addContactUs));
      }
      handleCloseAddCurrency();
    }
  };

  const handleCloseAddCurrency = () => {
    setAddCurrencyOpen(false);
    dispatch(closeDialog());
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData));
  };

  return (
    <div>
      <Modal
        open={addCurrencyOpen}
        onClose={handleCloseAddCurrency}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
        {/* <Box sx={style} className="create-channel-model"> */}
          <div className="model-header">
            <p className="m-0">
               {dialogueData ? "Edit Currency" : "Add Currency"}
            </p>
          </div>
    <div className="model-body">

          <form>
            <div className="row sound-add-box" style={{ overflowX: "hidden" }}>
              <Input
                label={"Name"}
                name={"name"}
                placeholder={"Enter Name"}
                value={name}
                errorMessage={error.name && error.name}
                onChange={(e: any) => {
                  setName(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      name: `Name Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      name: "",
                    });
                  }
                }}
              />
              <Input
                label={"Symbol"}
                name={"symbol"}
                placeholder={"Enter Symbol"}
                value={symbol}
                newClass={`mt-3`}
                errorMessage={error.symbol && error.symbol}
                onChange={(e: any) => {
                  setSymbol(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      symbol: `symbol Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      symbol: "",
                    });
                  }
                }}
              />
              <Input
                label={"Currency Code"}
                name={"currencyCode"}
                placeholder={"Enter CurrencyCode"}
                value={currencyCode}
                newClass={`mt-3`}
                errorMessage={error.currencyCode && error.currencyCode}
                onChange={(e: any) => {
                  setCurrencyCode(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      currencyCode: `CurrencyCode is required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      currencyCode: "",
                    });
                  }
                }}
              />
              <Input
                label={"Country Code"}
                name={"countryCode"}
                placeholder={"Enter countryCode"}
                value={countryCode}
                newClass={`mt-3`}
                errorMessage={error.countryCode && error.countryCode}
                onChange={(e: any) => {
                  setCountryCode(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      countryCode: `CountryCode is required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      countryCode: "",
                    });
                  }
                }}
              />

              
            </div>
          </form>
    </div>

    <div className="model-footer">
                <div className="p-3 d-flex justify-content-end">
                <Button
                  onClick={handleCloseAddCurrency}
                  btnName={"Close"}
                  newClass={"close-model-btn"}
                />
                <Button
                  onClick={handleSubmit}
                  btnName={"Submit"}
                  type={"button"}
                  newClass={"submit-btn"}
                  style={{
                    borderRadius: "0.5rem",
                    width: "80px",
                    marginLeft: "10px",
                  }}
                />
              </div>
    </div>

        </Box>
      </Modal>
    </div>
  );
};

export default CurrencyDialogue;
