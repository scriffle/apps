#include <stdio.h>#include <stdlib.h>#include <string.h>#define kMaxChars	128#define kNumWords	127000
#define kWhiteList	4380struct words{	char word[kMaxChars],pron[kMaxChars];}wordList[kNumWords],pronList[kNumWords]; 

struct list
{
		char word[kMaxChars];
}whiteList[kWhiteList];int main( void ) {	long 		bigloop, searchPoint,c,d,p,max,min,result, result1, result2, lastDiff,wordc,pronc;	char 		str [255],word[255],pron[255],query[255],swappron1[255],swappron2[255],aux,dictWord[255];	FILE		*dict,*lemmas,*output;				dict = fopen("compacted dict.txt", "r");	if(dict == NULL) 	{	printf("\nCannot open dict.txt\n");	exit(0);	}	
	lemmas = fopen("4380 lemmas.txt", "r");	if(lemmas == NULL) 	{	printf("\nCannot open 4380 lemmas whitelist.txt\n");	exit(0);	}
	
	output = fopen("output.txt", "w");	if(output == NULL) 	{	printf("\nCannot open output.txt\n");	exit(0);	}
	
	// load the whitelist

	c=0;	while(!feof(lemmas))	//	load the whitelist	{
		fgets(str,kMaxChars,lemmas);		//	get the entry
		str[strlen(str)-1]=0;	// truncate to string length
		strcpy(whiteList[c].word,str);
		//printf("%d %s\n",strlen(whiteList[c].word),whiteList[c].word);
		//	convert whitelist word to upper		for(d=0;d<(strlen(whiteList[c].word));d++){			if((whiteList[c].word[d]>='a')&&(whiteList[c].word[d]<='z')) whiteList[c].word[d]-=32;}			if (c++>=kNumWords) break;
}	printf("loaded whitelist\n");
	
	// read the word from the dict
	c=0;	while(!feof(dict))	
	{		fgets(str,kMaxChars,dict);		//	get the dict entry
		sscanf(str,"%s",&word);			//	get the dict word
		sscanf(&str[strlen(word)],"%s",&pron);		//	get the dict pronunciation		strcpy(wordList[c].word,word);		strcpy(wordList[c].pron,pron);		//printf("%d %s\n",c,wordList[c].pron);
		
		//	is the word in the whitelist?
		strcpy(dictWord,wordList[c].word);
		//printf("searching for %s\n",dictWord);				// search		min=0;		max=kWhiteList;		searchPoint=(max-min)/2;		do{			lastDiff = min+((max-min)/2);
			//printf("comparing %s and %s @ %d\n",dictWord,whiteList[searchPoint].word,searchPoint);			result = strcmp(dictWord,whiteList[searchPoint].word);			if(result<0){				max=searchPoint;				searchPoint=min+((max-min)/2);			}else				if(result>0){					min=searchPoint;					searchPoint=min+((max-min)/2);				}		}while((result!=0)&&(searchPoint!=lastDiff));				if(result==0){
			printf("%s %s\n",wordList[c].word,wordList[c].pron);
			fprintf(output,"%s %s\n",wordList[c].word,wordList[c].pron);
			wordc=searchPoint;
		} else printf("");
		
		// finish iteration
		c++;			if (c>=kNumWords) break;	}	printf("complete\n");
	return 0;}