#include <stdio.h>#include <stdlib.h>#include <string.h>
#include <stdbool.h>#define kMaxChars	48#define kNumWords	4380
#define kWordLimit	5000struct words{	char word[kMaxChars],pron[kMaxChars];}wordList[kNumWords],pronList[kNumWords],article[kWordLimit]; int main( void ) {	long 		littleloop, searchPointer,count,c,q,d,p,max,min,result, result1, result2, lastDiff,wordc,pronc, wordIndex, awptr;	char 		ch, str[255],word[255],pron[255],query[255],swappron1[255],swappron2[255],aux[255],articleWord[255];	FILE		*pw,*wp,*articleFP,*output;
	bool 		consecutiveWS=0;			wp = fopen("words pron.txt", "r");	if(wp == NULL)		{			printf("\nCannot open words pron.txt\n");			exit(0);		}		pw = fopen("pron words.txt", "r");	if(pw == NULL)		{			printf("\nCannot open pron words.txt\n");			exit(0);		}
		articleFP = fopen("article.txt", "r");	if(articleFP == NULL)		{			printf("\nCannot open article.txt\n");			exit(0);		}	
	output = fopen("output.txt", "w");	if(output == NULL)		{			printf("\nCannot open output.txt\n");			exit(0);		}
	
	c=0;	while(!feof(articleFP))	//	load the words	{	//	load the words	fgets(str,kMaxChars,wp);		//	get the entry	sscanf(str,"%s",&word);			//	get the word	sscanf(&str[strlen(word)],"%s",&pron);		//	get the pronunciation	strcpy(wordList[c].word,word);	strcpy(wordList[c].pron,pron);		//	load the pronunciations	fgets(str,kMaxChars,pw);		//	get the entry	sscanf(str,"%s",&pron);			//	get the pronunciation	sscanf(&str[strlen(pron)],"%s",&word);		//	get the word	strcpy(pronList[c].pron,pron);	strcpy(pronList[c].word,word);		c++;	if (c>=kNumWords) break;	}	printf("loaded\n");		if(wp != NULL)	fclose(wp);	if(pw != NULL)	fclose(pw);		//	scan words from article
	wordIndex=0; consecutiveWS=false;articleWord[0]=0;awptr=0;
	while (articleFP != EOF)
	{
		ch =fgetc(articleFP);
		/*if ((ch==' '||ch==13)&&consecutiveWS==false){
			consecutiveWS=true;
			; //copy word
			wordIndex++;
		}
		else if (ch >='a' && ch<= 'z')
			ch=-32;// capatalise
		else if (ch >='A' && ch<= 'Z')
			articleWord[awptr++]=ch;//	add letter
		else if(ch =='.' || ch ==',' || ch =='?' || ch ==':' || ch =='-' || ch =='"' )
			;//make punctuation word*/
		printf("%c",ch);
	}
	 //	is the word in the word list?
	/*min=0;	max=kNumWords;	searchPointer=(max-min)/2;	do{		lastDiff = min+((max-min)/2);		result = strcmp(word,wordList[searchPointer].word);		if(result<0){			max=searchPointer;			searchPointer=min+((max-min)/2);		}else			if(result>0){				min=searchPointer;				searchPointer=min+((max-min)/2);			}	}while((result!=0)&&(c!=lastDiff));	if(result==0){
		("word found\n");
		wordc=searchPointer;
	} else printf("word not found\n");
	
	//find the pron
	//	is the pron in the pron list?
	strcpy(pron,wordList[wordc].pron);	c=0;	do{		c++;
		result = strcmp(pron,pronList[c].pron);	}while((result!=0)&&(c<kNumWords));	
	if(result==0){
		printf("pron found\n");
		pronc=c;
	} else printf("pron not found\n");*/

printf("complete\n");
fclose(output);

return 0;}