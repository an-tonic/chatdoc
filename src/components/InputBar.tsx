import {Keyboard, TextInput, TouchableOpacity, Vibration, View} from "react-native";
import Icon from "@react-native-vector-icons/material-design-icons";
import {forwardRef, useImperativeHandle, useRef, useState} from "react";
import {useStyles} from "../custom_hooks/useStyles.ts";
import {useTheme} from "../context/ThemeContext.tsx";

export type InputBarHandle = {
    focus: () => void,
    getText: () => string,
    setText: (newText: string) => void,
    clear: () => void,
};


const InputBar = forwardRef<InputBarHandle, {
    pinnedImageID: number | null;
    onPressAttachFiles: () => void;
    onRecordPressIn?: () => void;
    onRecordPressOut?: () => void;
    onPressSendMessage: (text: string) => Promise<void>
}>((props, ref) => {

    console.log("InputBar component Rendered!");

    const [isRecording, setIsRecording] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const [inputText, setInputText] = useState("");
    const styles = useStyles();
    const {colors} = useTheme();
    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        getText: () => inputText,
        setText: (newText: string) => setInputText(newText), // <-- new method
        clear: () => setInputText(""),
    }));


    return <View style={styles.inputRow}>
        <TextInput
            placeholderTextColor={colors.textHint}
            ref={inputRef}
            style={styles.input}
            placeholder="Message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
        />
        <TouchableOpacity
            onPress={() => {
                Vibration.vibrate(5);
                props.onPressAttachFiles();
            }}
            style={styles.iconButton}>

            <Icon name="paperclip" size={24} color={colors.primaryMuted}/>
        </TouchableOpacity>

        <TouchableOpacity
            onLongPress={() => {
                setIsRecording(true);
                Vibration.vibrate(20);
                props.onRecordPressIn?.();
            }}

            onPressOut={() => {
                if (!isRecording) return;
                setIsRecording(false);
                Vibration.vibrate(5);
                props.onRecordPressOut?.();
            }}
            style={styles.iconButton}
            activeOpacity={1}
        >
            {isRecording && (
                <View style={styles.recordingBackground}/>
            )}
            <Icon
                name="microphone-outline"
                size={24}
                color={isRecording ? colors.primary : colors.primaryMuted}
            />
        </TouchableOpacity>


        <TouchableOpacity
            onPress={async () => {
                Keyboard.dismiss();
                const textToSend = inputText;
                setInputText("");
                Vibration.vibrate(5);
                await props.onPressSendMessage(textToSend);
            }}
            style={styles.iconButton}
            disabled={inputText.length === 0}>

            <Icon
                name={props.pinnedImageID ? "check-bold" : "send"}
                size={24}
                color={inputText.length > 0 ? colors.primary : colors.primaryMuted}
            />

        </TouchableOpacity>


    </View>;
});

export default InputBar;