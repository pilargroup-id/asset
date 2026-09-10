import { ref, type, Ref} from 'vue';

export function useFooter() {
    const isMobileOpen = ref(false);
    const isDekstopOpen = ref(false);
    
    const toggleMobileFooter = () => {
        isMobileOpen.value = !isMobileOpen.value;
    }

    return {
        isMobileOpen,
        isDekstopOpen,
        toggleMobileFooter,
    }
}

import { Ref, computed, onMounted, onUnmounted } from 'vue';
import type { FooterContextType } from '@/types/FooterContextType';

interface SidebarContextType {
    isExpanded: Ref<boolean>;
    isMobileOpen: Ref<boolean>;
    isHovered: Ref<boolean>;
    activeItem: Ref<string | null>;
    openSubmenu: Ref<string | null>;
    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;
    setIsHovered: (isHovered: boolean) => void;
    setActiveItem: (item: string | null) => void;
    toggleSubmenu: (item: string) => void;
}

const FooterSymbol = Symbol();

// export function setupFooterProvider() {
//    const mobile = window.innerWidth < 768;
//    isMobile.value = mobile;
//    if (!mobile){
//     isMoboileOpen.value = false;
//    } 
// }
