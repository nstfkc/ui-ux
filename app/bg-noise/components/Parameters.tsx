"use client";

import { BgNoise } from "@/components/BgNoise";
import { ComponentProps, useEffect, useReducer, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LuX } from "react-icons/lu";
import { Root as SwitchRoot, Thumb } from "@radix-ui/react-switch";
import { Color, defaultState, reducer } from "./reducer";
import * as _RadioGroup from "@radix-ui/react-radio-group";
import { ColorInput } from "@/components/ColorPicker";

interface RadioGroupProps extends ComponentProps<typeof _RadioGroup.Root> {
  items: { label: string; value: string }[];
}

const RadioGroup = ({ items, ...props }: RadioGroupProps) => {
  return (
    <_RadioGroup.Root className="flex gap-2" {...props}>
      {items.map((item) => (
        <div className="flex items-center" key={item.value}>
          <_RadioGroup.Item
            className="bg-white/60 size-[16px] rounded-full shadow-[0_2px_10px] shadow-black/40 hover:bg-white/80 focus:shadow-[0_0_0_2px] focus:shadow-black outline-none cursor-default"
            value={item.value}
            id={item.value}
          >
            <_RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[11px] after:h-[11px] after:rounded-[50%] after:bg-black" />
          </_RadioGroup.Item>
          <label
            className="text-white text-[15px] leading-none pl-[15px]"
            htmlFor={item.value}
          >
            {item.label}
          </label>
        </div>
      ))}
      <a href=""></a>
    </_RadioGroup.Root>
  );
};

export const Switch = (props: ComponentProps<typeof SwitchRoot>) => {
  return (
    <SwitchRoot
      className="border border-neutral-950/30 w-[42px] h-[25px] bg-black/60 rounded-full relative bg-neutral-700 data-[state=checked]:bg-black/50 outline-none cursor-default"
      {...props}
    >
      <Thumb className="block w-[20px] h-[20px] shadow-sm bg-white/40 rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]" />
    </SwitchRoot>
  );
};

const RangeSlider = (props: {
  colors: Color[];
  updateColorStops: (nextColorStopArray: number[]) => void;
  trackBackground?: string;
}) => {
  const { colors, updateColorStops, trackBackground } = props;
  return (
    <Slider.Root
      className="relative flex items-center select-none touch-none h-5"
      value={colors.map((color) => color.stop)}
      onValueChange={updateColorStops}
      min={0}
      max={100}
      step={1}
      minStepsBetweenThumbs={5}
    >
      <Slider.Track
        style={{ background: trackBackground }}
        className="w-full relative grow h-6 rounded-md"
      >
        <Slider.Range className="absolute h-full" />
      </Slider.Track>
      {colors.map((color, idx) => (
        <Slider.Thumb
          key={`thumb-${color.id}-${idx}`}
          style={{ background: color.id }}
          className="group relative w-4 border h-8 border-2 border-white/20 rounded-full block outline-none"
        ></Slider.Thumb>
      ))}
    </Slider.Root>
  );
};

const RadiiSlider = (props: ComponentProps<typeof Slider.Root>) => {
  return (
    <Slider.Root
      className="relative flex items-center select-none touch-none h-6 rounded-md bg-white/10"
      {...props}
    >
      <Slider.Track className="w-full relative grow h-8">
        <Slider.Range className="absolute h-full" />
      </Slider.Track>

      <Slider.Thumb className="w-4 border h-8 border-2 border-white/20 rounded-full block"></Slider.Thumb>
    </Slider.Root>
  );
};

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      className="bg-white/10 backdrop-blur-[2px] w-[320px] rounded-xl p-4"
      {...props}
    ></div>
  );
};

export function SortableItem(props: {
  color: string;
  onChange: (color: string) => void;
  handleRemoveColor: () => void;
  showRemoveButton?: boolean;
  id: string;
  editModeEnabled: boolean;
}) {
  const {
    color,
    onChange,
    handleRemoveColor,
    showRemoveButton = true,
    editModeEnabled = false,
  } = props;
  const { attributes, listeners, setNodeRef, transform, transition, active } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (editModeEnabled) {
    return (
      <ColorInput
        className="size-12 rounded-md overflow-hidden border-2 border-white/10"
        value={color}
        onValueChange={(e) => onChange(e.valueAsString)}
      />
    );
  }

  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        aria-describedby={`item-${props.id}`}
      >
        <div className="group">
          <ColorInput
            className="size-12 rounded-md overflow-hidden border-2 border-white/20"
            value={color}
            onValueChange={(e) => onChange(e.valueAsString)}
          />
        </div>
        {showRemoveButton && (
          <button
            onClick={(event) => {
              event.preventDefault();
              handleRemoveColor();
            }}
            className="absolute right-[-6px] top-[-6px] z-[100] rounded-full p-[1px] bg-white/80 shadow-sm"
          >
            <LuX />
          </button>
        )}
      </div>
    </div>
  );
}

function Colors(props: {
  colors: Color[];
  handleAddColor: VoidFunction;
  handleUpdateColorCode: (id: string, code: string) => void;
  handleUpdateColorOrder: (id1: string, id2: string) => void;
  handleRemoveColor: (id: string) => void;
}) {
  const {
    handleAddColor,
    colors,
    handleRemoveColor,
    handleUpdateColorCode,
    handleUpdateColorOrder,
  } = props;

  const [editModeEnabled, setEditModeEnabled] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="flex gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={colors.map((color) => color.id)}
          strategy={horizontalListSortingStrategy}
        >
          {colors.map((color) => (
            <SortableItem
              editModeEnabled={editModeEnabled}
              id={color.id}
              showRemoveButton={colors.length > 1}
              handleRemoveColor={() => {
                handleRemoveColor(color.id);
              }}
              onChange={(code) => {
                handleUpdateColorCode(color.id, code);
              }}
              key={color.id}
              color={color.code}
            ></SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      <button onClick={handleAddColor}>Add</button>
      <button onClick={() => setEditModeEnabled((s) => !s)}>Edit</button>
    </div>
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      handleUpdateColorOrder(active.id, over.id);
    }
  }
}

export const NoiseParameters = () => {
  const [ready, setReady] = useState(false);
  const [state, dispatch] = useReducer(reducer, defaultState);

  let bg = (_deg: number) => state.colors[0].code;
  if (state.colors.length > 1) {
    bg = (deg: number) =>
      `${state.gradientType}(${
        state.gradientType === "linear-gradient"
          ? `${deg}deg`
          : "circle at center"
      }, ${state.colors
        .map((color) => `${color.code} ${color.stop}%`)
        .join(", ")})`;
  }

  const railBg = `linear-gradient(90deg,${state.colors
    .map((color) => `${color.code} ${color.stop}%`)
    .join(", ")})`;

  useEffect(() => {
    if (!ready) {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <div
      style={{
        background: bg(state.gradientAngle),
      }}
      className="w-full h-full relative"
    >
      <div className="absolute z-0 pointer-events-none w-full h-full">
        <BgNoise
          baseFrequency={state.noiseIntensity}
          opacity={state.noiseOpacity}
          type={state.noiseType}
        />
      </div>
      <div className="w-full h-full relative z-10 p-4 flex justify-end">
        <Container>
          <div>
            <div className="text-lg">Background</div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div>Colors</div>
                <Colors
                  colors={state.colors}
                  handleRemoveColor={(id) => {
                    dispatch({
                      type: "REMOVE_COLOR",
                      payload: {
                        id,
                      },
                    });
                  }}
                  handleUpdateColorCode={(id, code) => {
                    dispatch({
                      type: "UPDATE_COLOR_CODE",
                      payload: { id, code },
                    });
                  }}
                  handleUpdateColorOrder={(id1, id2) => {
                    dispatch({
                      type: "SWAP_COLORS",
                      payload: {
                        id1,
                        id2,
                      },
                    });
                  }}
                  handleAddColor={() =>
                    dispatch({
                      type: "ADD_COLOR",
                      payload: {
                        code: "#333021",
                      },
                    })
                  }
                />
              </div>
              {state.colors.length > 1 && (
                <div className="flex flex-col gap-1">
                  <div>Color stops</div>
                  <RangeSlider
                    colors={state.colors}
                    updateColorStops={(nextColorStopArray) => {
                      dispatch({
                        type: "UPDATE_COLOR_STOPS",
                        payload: {
                          colorStopsArray: nextColorStopArray,
                        },
                      });
                    }}
                    trackBackground={railBg}
                  />
                </div>
              )}
              {state.colors.length > 1 && (
                <div>
                  <div>Gradient type</div>
                  <RadioGroup
                    value={state.gradientType}
                    onValueChange={(gradientType) => {
                      dispatch({
                        type: "UPDATE_GRADIENT_TYPE",
                        payload: {
                          gradientType: gradientType as any,
                        },
                      });
                    }}
                    items={[
                      { label: "Linear", value: "linear-gradient" },
                      { label: "Radial", value: "radial-gradient" },
                    ]}
                  />
                </div>
              )}
              {state.colors.length > 1 &&
                state.gradientType === "linear-gradient" && (
                  <div className="flex flex-col gap-1">
                    <div className="">Angle</div>
                    <RadiiSlider
                      value={[state.gradientAngle]}
                      onValueChange={([gradientAngle]) =>
                        dispatch({
                          type: "UPDATE_GRADIENT_ANGLE",
                          payload: {
                            gradientAngle,
                          },
                        })
                      }
                      min={0}
                      max={360}
                    />
                  </div>
                )}
            </div>
          </div>
          <div className="h-8"></div>
          <div>
            <div className="text-lg">Noise</div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div>Base frequency</div>
                <RadiiSlider
                  value={[state.noiseIntensity]}
                  onValueChange={([noiseIntensity]) =>
                    dispatch({
                      type: "UPDATE_NOISE_INTENSITY",
                      payload: {
                        noiseIntensity,
                      },
                    })
                  }
                  min={0}
                  max={2}
                  step={0.01}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div>Opacity</div>
                <RadiiSlider
                  value={[state.noiseOpacity]}
                  onValueChange={([noiseOpacity]) =>
                    dispatch({
                      type: "UPDATE_NOISE_OPACITY",
                      payload: {
                        noiseOpacity,
                      },
                    })
                  }
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
              <div>
                <div>Noise type</div>
                <RadioGroup
                  value={state.noiseType}
                  onValueChange={(noiseType) => {
                    dispatch({
                      type: "UPDATE_NOISE_TYPE",
                      payload: {
                        noiseType: noiseType as any,
                      },
                    });
                  }}
                  items={[
                    { label: "Fractal noise", value: "fractalNoise" },
                    { label: "Turbulence", value: "turbulence" },
                  ]}
                />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};
