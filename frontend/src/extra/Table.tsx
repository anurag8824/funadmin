import React, { useState } from "react";

export default function Table(props: any) {
  const {
    data,
    checkBoxShow,
    mapData,
    Page,
    PerPage,
    type,
    style,
    onChildValue,
    selectAllChecked,
    handleSelectAll,
  } = props;

  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [checkBox, setCheckBox] = useState<any>();

  const sortedData =
    data?.length > 0
      ? [...data].sort((a: any, b: any) => {
          const valueA = a[sortColumn];
          const valueB = b[sortColumn];

          if (valueA < valueB) {
            return sortOrder === "asc" ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortOrder === "asc" ? 1 : -1;
          }
          return 0;
        })
      : data;

  const startIndex = (Page - 1) * PerPage;
  const endIndex = startIndex + PerPage;

  const currentPageData = Array.isArray(data)
    ? data.slice(startIndex, endIndex)
    : [];

  return (
    <>
      <div
        className="primeMain table-custom"
        // style={{ paddingLeft: "10px", paddingRight: "10px" }}
      >
        <table
          width="100%"
          className="primeTable text-center"
          style={{ ...style }}
        >
          <thead
            className=""
            style={{ zIndex: "1", position: "sticky", top: "0" }}
          >
            <tr>
              {mapData?.map((res: any) => (
                <th className="text-nowrap" key={res.Header}>
                  <div className={" table-head " + res?.HeaderClass || ""}>
                    {res?.Header === "checkBox" ? (
                      <input
                        type="checkbox"
                        checked={selectAllChecked}
                        onChange={handleSelectAll}
                      />
                    ) : (
                      `${" "}${res?.Header}`
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {type === "server" && (
            <tbody style={{ maxHeight: "600px" }}>
              {sortedData?.length > 0 ? (
                <>
                  {(PerPage > 0
                    ? [sortedData]?.slice(
                        Page * PerPage,
                        Page * PerPage + PerPage
                      )
                    : sortedData
                  ).map((i: any, k: any) => (
                    <tr key={k}>
                      {mapData.map((res: any) => (
                        <td key={res.body}>
                          {res.Cell ? (
                            <res.Cell row={i} index={k} />
                          ) : (
                            <span className={res?.class}>{i[res?.body]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={25}
                    className="text-center"
                    style={{ borderBottom: "none" , padding : '20px' }}
                  >
                    No Data Found !
                  </td>
                </tr>
              )}
            </tbody>
          )}

          {type === "client" && (
            <tbody style={{ maxHeight: "600px" }}>
              {currentPageData?.length > 0 ? (
                <>
                  {currentPageData.map((i: any, k: any) => (
                    <tr key={k}>
                      {mapData.map((res: any) => (
                        <td key={res?.body}>
                          {res?.Cell ? (
                            <res.Cell row={i} index={k} />
                          ) : (
                            <span className={res?.class}>{i[res?.body]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={16}
                    className="text-center"
                    style={{ borderBottom: "none" , padding : "20px" }}
                  >
                    No Data Found !
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
    </>
  );
}
