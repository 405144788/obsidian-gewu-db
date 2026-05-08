import React from "react";
import { TFile } from "obsidian";
import { CellComponentProps } from "cdm/ComponentsModel";

const ImageCell = React.memo(function ImageCell(props: CellComponentProps) {
  const { defaultCell } = props;
  const { table } = defaultCell;
  const view = table.options.meta.view;
  const cellValue = defaultCell.getValue() as string | undefined;

  if (!cellValue) {
    return <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>无图片</span>;
  }

  const file = view.app.vault.getAbstractFileByPath(cellValue);
  if (file instanceof TFile) {
    const src = view.app.vault.getResourcePath(file);
    return (
      <img
        src={src}
        alt=""
        style={{
          width: "60px",
          height: "60px",
          objectFit: "cover",
          borderRadius: "4px",
        }}
        loading="lazy"
      />
    );
  }

  return <span style={{ color: "var(--text-error)", fontSize: "12px" }}>路径无效</span>;
});

export default ImageCell;
