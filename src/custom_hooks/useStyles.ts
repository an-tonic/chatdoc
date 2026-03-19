// styles/useStyles.ts
import {makeStyles} from '../styles/styles.ts';
import {useTheme} from '../context/ThemeContext.tsx';

export const useStyles = () => {
    const {colors} = useTheme();
    return makeStyles(colors);
};