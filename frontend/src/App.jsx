import { useState } from "react";
import "./App.css";
import { useQueryDishes } from "./hooks/useQueryDishes";
import Dish from "./components/Dish";

function App() {
  const { data: dishes } = useQueryDishes();
  return (
    <>
      <section id="center">
        <ul>
          <li> init project</li>
          <li>
            <b>Backend:</b> <a href="https://cs732-groupproj.fly.dev">Link</a>
          </li>
          <li>
            <b>Frontend:</b>
            <a href="https://uoa-cs732-s1-2026.github.io/group-project-helicopter/">
              Link
            </a>
          </li>
          <li>
            If you see this message without manually deployment, CI/CD is
            working
          </li>
        </ul>
        <ul>
          {dishes.map((dishType, index) => (
            <div key={index}>
              <h5>{dishType.name}</h5>
              <p>{dishType.style}</p>
              {dishType.dishes.map((dish) => (
                <Dish key={dish.id} id={dish.id}></Dish>
              ))}
            </div>
          ))}
        </ul>
      </section>
    </>
  );
}

export default App;
