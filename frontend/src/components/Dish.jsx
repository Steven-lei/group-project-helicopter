import { useQueryDish } from "../hooks/useQueryDish";

export default function Dish({ id }) {
  const { data: dish } = useQueryDish(id);
  return (
    <>
      <div>
        <div>
          {dish.name_en}- {dish.name_zh}
        </div>
        <div>
          Ingredients:
          {dish?.ingredients?.map((ingredient, index) => (
            <span key={index}>{(ingredient ?? "") + ","}</span>
          ))}
        </div>
      </div>
    </>
  );
}
