import React from "react";
import { NavLink } from "react-router-dom";
import "./ItemForms.css";

export default function ItemNavBar() {
  return (
    <div className="item-nav-bar">
      <NavLink
        to="/item/CreateItem"
        className={({ isActive }) =>
          "item-nav-link" + (isActive ? " active" : "")
        }
      >
        ➕ Create Item
      </NavLink>

     

      <NavLink
        to="/item/EditItem"
        className={({ isActive }) =>
          "item-nav-link" + (isActive ? " active" : "")
        }
      >
        ✏️ View/Edit Item
      </NavLink>
      
    </div>
  );
}
