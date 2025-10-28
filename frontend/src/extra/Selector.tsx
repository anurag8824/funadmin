import React from "react";

export default function Selector(props: any) {
  const {
    label,
    placeholder,
    selectValue,
    paginationOption,
    id,
    labelShow,
    selectData,
    onChange,
    type,
    isdisabled,
    defaultValue,
    errorMessage,
    selectId,
    data,
  } = props;


  return (
    <div className="selector-custom">
      {labelShow === false ? (
        " "
      ) : (
        <label htmlFor={id} className="label-selector-custom m-0">
          {label}
        </label>
      )}

      <div style={{ minWidth: 120 }} className="form-group">
        <div className="form-outline w-100">
          <select
            id="formControlLg"
            className=" form-select py-2 text-capitalize"
            aria-label={label}
            value={selectValue ? selectValue : ""}
            aria-placeholder={placeholder}
            defaultValue={defaultValue ? defaultValue : ""}
            onChange={onChange}
            style={{ borderRadius: "5px", maxHeight: "200px" }}
            disabled={data?.isFake == false || isdisabled}
            
          >
            {paginationOption === false ? (
              ""
            ) : (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {selectData?.map((item: any, index: number) => {
              const displayValue = selectId
                ? (item as { _id: string; name: string; fullName?: string })
                    .fullName ||
                  (item as { _id: string; name: string; fullName?: string })
                    .name
                : typeof item === "string"
                ? item.toLowerCase()
                : item;
              return (
                <option
                  value={
                    selectId
                      ? (item as { _id: string })._id
                      : typeof item === "string"
                      ? item.toLowerCase()
                      : item
                  }
                  key={index}
                  className="py-2"
                >
                  {displayValue}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      {errorMessage && (
        <p className="errorMessage">{errorMessage && errorMessage}</p>
      )}
    </div>
  );
}
