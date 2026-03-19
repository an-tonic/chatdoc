import {Dimensions, StyleSheet} from 'react-native';
import {Theme} from './theme.ts';

const screenWidth = Dimensions.get('window').width;

export const makeStyles = (colors: Theme) => StyleSheet.create({
    container: {padding: 20},

    welcomeText: {
        fontSize: 17,
        color: colors.textHint,
        fontWeight: 'thin',
        fontFamily: 'Roboto',
        lineHeight: 30,
        textAlign: 'center',
        textAlignVertical: 'center',
        height: 300,
        paddingHorizontal: 50,
    },

    pinnedImageBubble: {
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: 8,
        position: 'relative',
    },

    fileBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 4,
        padding: 2,
    },

    descriptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingTop: 4,
        paddingBottom: 2,
    },

    chatContainer: {
        padding: 5,
        gap: 3,
        flexDirection: 'column',
    },

    textBubble: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        marginVertical: 4,
        maxWidth: '85%',
    },
    textMessage: {
        fontSize: 15,
        color: colors.textPrimary,
    },

    imageBubble: {
        alignSelf: 'flex-end',
        backgroundColor: colors.bgSecondary,
        borderRadius: 4,
        padding: 3,
        width: screenWidth * 0.6,
    },
    msgLeft: {
        alignSelf: 'flex-start',
        backgroundColor: colors.bgBubbleSearch,
    },
    msgRight: {
        alignSelf: 'flex-end',
        backgroundColor: colors.bgBubbleUser,
    },

    imageWrapper: {
        width: '100%',
        aspectRatio: 1,
    },

    image: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    imageDescription: {
        color: colors.textSecondary,
        fontSize: 12,
        paddingTop: 4,
        paddingHorizontal: 6,
        textAlign: 'left',
    },
    defaultButton: {
        backgroundColor: colors.primary,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },

    dangerButton: {
        backgroundColor: colors.danger,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },

    buttonText: {
        color: colors.textOnPrimary,
        textAlign: 'center',
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 0,
        padding: 5,
        borderWidth: 0,
        overflow: 'hidden',
        backgroundColor: colors.bgSecondary,
    },

    input: {
        flex: 1,
        paddingLeft: 10,
        fontSize: 18,
        color: colors.textPrimary,
    },

    iconButton: {
        backgroundColor: 'rgba(0,0,0,0)',
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },

    recordingBackground: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryMuted,
        zIndex: -1,
    },

    scrollDownButton: {
        position: 'absolute',
        bottom: 60,
        right: 15,
        backgroundColor: colors.textPrimary,
        borderRadius: 30,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        zIndex: 10,
    },
    scrollDownText: {
        color: colors.textOnPrimary,
        fontSize: 24,
    },
});