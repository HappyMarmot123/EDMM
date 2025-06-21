import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Heart, LayoutList } from "lucide-react";
import MyTooltip from "@/shared/components/myTooltip";
import { User } from "@supabase/supabase-js";
import {
  ButtonConfig,
  TabButtonMethod,
  TabButtonProps,
  TabButtonFactoryProps,
} from "@/shared/types/dataType";

/*
  TODO:
  팩토리 패턴
*/

class ButtonRenderer implements TabButtonMethod {
  private config: ButtonConfig;

  constructor(config: ButtonConfig) {
    this.config = config;
  }

  isDisabled(user: User | null): boolean {
    return this.config.isDisabled(user);
  }

  wrapWithTooltip(button: React.ReactNode, user: User | null): React.ReactNode {
    if (this.config.wrapWithTooltip) {
      return this.config.wrapWithTooltip(button, user);
    }
    return button;
  }

  render(props: TabButtonProps): React.ReactElement {
    const { activeButton, setActiveButton, user } = props;
    const button = (
      <motion.button
        disabled={this.isDisabled(user)}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
        onClick={() => setActiveButton(this.config.type)}
        className={clsx(
          "px-3 py-1 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none flex items-center justify-center space-x-2 border border-white/20",
          activeButton === this.config.type
            ? this.config.activeColorClasses
            : this.config.inactiveColorClasses,
          this.isDisabled(user) && "cursor-not-allowed opacity-70"
        )}
      >
        <this.config.Icon size={16} />
        <span>{this.config.text}</span>
      </motion.button>
    );

    return this.wrapWithTooltip(button, user) as React.ReactElement;
  }
}

const likeButtonConfig: ButtonConfig = {
  type: "heart",
  Icon: Heart,
  text: "Favorite",
  activeColorClasses:
    "bg-purple-600/80 hover:bg-purple-700/80 ring-1 ring-purple-500 ring-opacity-50",
  inactiveColorClasses: "bg-purple-300/50 hover:bg-purple-500/60",
  isDisabled: (user) => !user,
  wrapWithTooltip: (button, user) => (
    <MyTooltip tooltipText="You need to Login!" showTooltip={!user}>
      {button}
    </MyTooltip>
  ),
};

const availableButtonConfig: ButtonConfig = {
  type: "available",
  Icon: LayoutList,
  text: "List",
  activeColorClasses:
    "bg-emerald-600/80 hover:bg-emerald-700/80 ring-1 ring-emerald-500 ring-opacity-50",
  inactiveColorClasses: "bg-emerald-300/50 hover:bg-emerald-500/60",
  isDisabled: () => false,
};

export default function TabButtonFactory({
  type,
  props,
}: TabButtonFactoryProps): React.ReactElement | null {
  switch (type) {
    case "heart":
      return new ButtonRenderer(likeButtonConfig).render(props);
    case "available":
      return new ButtonRenderer(availableButtonConfig).render(props);
    default:
      return null;
  }
}
