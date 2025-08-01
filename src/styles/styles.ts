import {Dimensions, StyleSheet} from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const styles = StyleSheet.create({
    container: {padding: 20},


    pinnedImageBubble: {
        borderWidth: 2,
        borderColor: '#0b43d6',
        borderRadius: 8,
        position: 'relative',
    },

    pinIconOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 2,
    },


    chatContainer: {
        padding: 10,
        gap: 10,
        flexDirection: 'column',
    },

    textBubble: {
        backgroundColor: '#e3e2e2',
        padding: 10,
        borderRadius: 10,
        marginVertical: 4,
        maxWidth: '80%',
        alignSelf: 'flex-end', // or 'flex-start' for received messages
    },
    textMessage: {
        fontSize: 16,
        color: '#333',
    },

    imageBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#eae9e9',
        borderRadius: 12,
        padding: 5,
        width: screenWidth * 0.6,

    },
    msgLeft: {
        alignSelf: 'flex-start',
        backgroundColor: '#d6d6d6'
    },
    msgRight: {
        alignSelf: 'flex-end',
        backgroundColor: '#d0e0ff'
    },

    imageWrapper: {
        width: '100%',
        aspectRatio: 1,
    },

    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    imageDescription: {
        color: '#555',
        fontSize: 12,
        paddingTop: 4,
        paddingHorizontal: 6,
        textAlign: 'left',
    },
    defaultButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },

    dangerButton: {
        backgroundColor: '#ff0000',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },

    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 0,
        padding: 5,
        borderWidth: 0,
        overflow: 'hidden',
        backgroundColor: '#e1e0e0'
    },

    input: {
        flex: 1,
        paddingLeft: 10,
        fontSize: 18
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
        width: 80, // larger than the touchable
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(11,67,214,0.2)', // translucent fill
        zIndex: -1,
    },



    scrollDownButton: {
        position: 'absolute',
        bottom: 60,
        right: 15,
        backgroundColor: '#333',
        borderRadius: 30,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        zIndex: 10,
    },
    scrollDownText: {
        color: 'white',
        fontSize: 24,
    },


});
